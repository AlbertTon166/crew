# Docker Setup Guide

This document describes the Docker configuration required for the Crew agent teams manager sandbox execution system.

## Overview

Crew uses Docker-in-Docker (DinD) to execute AI-generated code in isolated containers with resource limits and timeout controls.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Host Machine                         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │              Docker Daemon (Host)                │  │
│  │                                                 │  │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐        │  │
│  │   │ Agent 1 │  │ Agent 2 │  │ Agent N │        │  │
│  │   │Container│  │Container│  │Container│        │  │
│  │   └────┬────┘  └────┬────┘  └────┬────┘        │  │
│  └────────┼─────────────┼─────────────┼────────────┘  │
│           │             │             │               │
└───────────┼─────────────┼─────────────┼───────────────┘
            │             │             │
            └─────────────┴─────────────┘
                      Docker Socket
                        (/var/run/docker.sock)
                            │
                            ▼
              ┌─────────────────────────────┐
              │   Server (Node.js)         │
              │   - sandbox.js             │
              │   - test-runner.js        │
              │   - docker.js             │
              └─────────────────────────────┘
```

## Docker Socket Configuration

### Option 1: Docker Socket Mount (Recommended for Development)

Mount the Docker socket into the server container:

```yaml
# docker-compose.yml
services:
  crew-server:
    image: crew-server:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - DOCKER_SOCKET=/var/run/docker.sock
```

**Security Note**: Mounting the Docker socket with write access gives the container full host Docker access. Use read-only (`:ro`) when possible.

### Option 2: TCP Docker Daemon (Production)

Configure Docker daemon to listen on TCP with TLS:

```json
// /etc/docker/daemon.json
{
  "hosts": ["fd://", "tcp://0.0.0.0:2376"],
  "tls": true,
  "tlscert": "/var/lib/docker/certs/server.crt",
  "tlskey": "/var/lib/docker/certs/server.key",
  "tlsverify": true
}
```

Environment variable:
```bash
export DOCKER_HOST=tcp://localhost:2376
export DOCKER_TLS_VERIFY=1
```

### Option 3: Docker-in-Docker (Privileged)

For DinD, start the server with privileged mode:

```yaml
services:
  crew-server:
    image: crew-server:latest
    privileged: true
    environment:
      - DOCKER_BUILDKIT=1
```

**Warning**: `privileged` mode disables security restrictions. Only use in isolated environments.

## Resource Limits

### Per-Container Limits

| Resource | Default | Maximum | Description |
|----------|---------|---------|-------------|
| CPU | 1.0 core | 4 cores | CPU allocation |
| Memory | 512 MB | 2 GB | RAM limit |
| PIDs | 100 | 500 | Max processes |
| Storage | 100 MB | 500 MB | Ephemeral storage |

### Host System Requirements

- **Minimum**: 2 CPU cores, 4 GB RAM
- **Recommended**: 4 CPU cores, 8 GB RAM
- **Storage**: 10 GB+ available for container images

## Network Configuration

By default, sandbox containers run with `network=none` for maximum isolation.

### Network Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `none` | No network access | Untrusted code execution |
| `bridge` | Shared bridge network | Code needing network (pip install, npm) |
| `host` | Host network namespace | Performance-critical code |

### Bridge Network Setup (for package installation)

```javascript
// Create a bridge network for test containers
docker network create crew-network

// Or configure in sandbox.js
const sandbox = new Sandbox({
  networkMode: 'bridge',
  // Note: This allows outbound network only
})
```

## Security Configuration

### Security Options Enabled

```javascript
--read-only=true           // Read-only filesystem
--cap-drop=ALL            // Drop all Linux capabilities
--security-opt=no-new-privileges  // Prevent privilege escalation
--tmpfs /tmp:rw,noexec,nosuid,size=100m  // Secure /tmp
--memory-swap=<memory>    // Disable swap (prevents memory exhaustion)
```

### Additional Hardening

1. **AppArmor/SELinux**: Enable on the host
2. **Seccomp**: Use custom seccomp profile for production
3. **User Namespace Remapping**: Run containers as non-root

```json
// seccomp-profile.json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "syscalls": [
    { "names": ["read", "write", "exit"], "action": "SCMP_ACT_ALLOW" }
  ]
}
```

## Image Requirements

### Base Images Used

| Language | Image | Size |
|----------|-------|------|
| Python | `python:3.11-slim` | ~130 MB |
| JavaScript | `node:20-slim` | ~180 MB |
| Go | `golang:1.22-alpine` | ~250 MB |
| Java | `eclipse-temurin:17-alpine` | ~220 MB |

### Pre-pull Images

```bash
docker pull python:3.11-slim
docker pull node:20-slim
docker pull golang:1.22-alpine
```

## Troubleshooting

### Permission Denied on Docker Socket

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Or set socket permissions
sudo chmod 666 /var/run/docker.sock
```

### Container Cannot Start

Check available resources:
```bash
docker info | grep "Memory Limit"
docker info | grep "CPU"
```

### Network Issues

If containers can't reach external resources:
```bash
# Check DNS
docker run --rm --network=host node:20-slim ping -c 1 google.com

# Enable bridge network
docker network create crew-bridge
```

## Docker Socket Permissions

The server requires read access to `/var/run/docker.sock` to:
- List containers
- Create containers
- Execute commands in containers
- Remove containers
- Get container stats

Without proper permissions, you may see:
```
Error: connect EACCES /var/run/docker.sock
```

### Minimum Required Permissions

```bash
# For read-only operations only (list, stats)
chmod 660 /var/run/docker.sock

# For full control (create, execute, remove)
chmod 666 /var/run/docker.sock
```

## Production Checklist

- [ ] Docker daemon running with TLS
- [ ] Firewall configured for Docker ports (if using TCP)
- [ ] Resource limits set in daemon.json
- [ ] Logging configured for containers
- [ ] Image pre-pulled for faster execution
- [ ] Monitoring set up (cAdvisor, Prometheus)
- [ ] Backup strategy for container data

## See Also

- [sandbox.js](../server/sandbox.js) - Container management API
- [test-runner.js](../server/test-runner.js) - Test execution API
- [docker.js](../server/docker.js) - Deployment module
