-- Crew Demo Data Seed
-- Version: 002_demo_data
-- Description: Insert demo data for Agent/Project/Task/Roles

-- ============================================
-- DEMO USER (for demo login)
-- ============================================
INSERT INTO users (id, username, email, password_hash, role, active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'demo',
    'demo@crew.local',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyDAOWaYGON.Wq', -- admin123
    'user',
    true
) ON CONFLICT (username) DO NOTHING;

-- ============================================
-- DEMO AGENTS (6 types matching enum)
-- ============================================
INSERT INTO agents (id, name, role, model_provider, model_name, system_prompt, skills, personality, status, enabled, avg_response_time, task_count, current_load)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', 'PM Agent Alice', 'pm', 'openai', 'gpt-4',
     'You are a professional Product Manager with 10 years of experience. You excel at breaking down requirements into actionable tasks and coordinating team efforts.',
     ARRAY['requirement_analysis', 'task_planning', 'team_coordination'],
     'Professional, organized, clear communicator',
     'online', true, '2.5s', 12, 0.3),
    
    ('b0000000-0000-0000-0000-000000000002', 'Planner Agent Bob', 'planner', 'openai', 'gpt-4',
     'You are a strategic planner who excels at creating comprehensive project plans, estimating timelines, and identifying potential risks.',
     ARRAY['strategic_planning', 'risk_assessment', 'timeline_estimation'],
     'Analytical, thorough, proactive',
     'online', true, '3.1s', 8, 0.2),
    
    ('b0000000-0000-0000-0000-000000000003', 'Coder Agent Charlie', 'coder', 'minimax', 'MiniMax-M2.7',
     'You are a senior full-stack developer proficient in React, Node.js, and Python. You write clean, maintainable code following best practices.',
     ARRAY['frontend', 'backend', 'database', 'api_design'],
     'Detail-oriented, efficient, quality-focused',
     'busy', true, '5.2s', 24, 0.8),
    
    ('b0000000-0000-0000-0000-000000000004', 'Reviewer Agent Diana', 'reviewer', 'openai', 'gpt-4',
     'You are a meticulous code reviewer with expertise in security, performance, and code quality. You provide constructive feedback that improves overall code health.',
     ARRAY['code_review', 'security_audit', 'performance_optimization'],
     'Critical, thorough, constructive',
     'idle', true, '1.8s', 15, 0.4),
    
    ('b0000000-0000-0000-0000-000000000005', 'Tester Agent Evan', 'tester', 'openai', 'gpt-4',
     'You are a QA engineer specialized in automated testing, including unit tests, integration tests, and end-to-end tests. You ensure high code coverage.',
     ARRAY['unit_testing', 'integration_testing', 'e2e_testing', 'test_automation'],
     'Methodical, detail-oriented, thorough',
     'online', true, '2.9s', 18, 0.5),
    
    ('b0000000-0000-0000-0000-000000000006', 'Deployer Agent Frank', 'deployer', 'openai', 'gpt-4',
     'You are a DevOps engineer expert in CI/CD pipelines, containerization, and cloud deployment. You ensure smooth and reliable deployments.',
     ARRAY['ci_cd', 'docker', 'kubernetes', 'aws', 'monitoring'],
     'Reliable, systematic, security-conscious',
     'idle', true, '4.5s', 6, 0.2)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DEMO PROJECTS
-- ============================================
INSERT INTO projects (id, name, description, status, owner_id, team_members)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 
     'E-commerce Platform v2.0', 
     'Build a modern e-commerce platform with React frontend and Node.js backend, featuring real-time inventory management and payment integration.',
     'active',
     'a0000000-0000-0000-0000-000000000001',
     ARRAY['b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003']),
    
    ('c0000000-0000-0000-0000-000000000002', 
     'Mobile App API Development', 
     'Develop RESTful APIs for the new mobile application including user authentication, profile management, and push notification services.',
     'active',
     'a0000000-0000-0000-0000-000000000001',
     ARRAY['b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004']),
    
    ('c0000000-0000-0000-0000-000000000003', 
     'Data Analytics Dashboard', 
     'Create an interactive dashboard for business intelligence with real-time data visualization and customizable reports.',
     'active',
     'a0000000-0000-0000-0000-000000000001',
     ARRAY['b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000006'])
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PROJECT-AGENTS MAPPING
-- ============================================
INSERT INTO project_agents (project_id, agent_id)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002'),
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003'),
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004'),
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005'),
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006'),
    ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001'),
    ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003'),
    ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004'),
    ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002'),
    ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003'),
    ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005'),
    ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000006')
ON CONFLICT (project_id, agent_id) DO NOTHING;

-- ============================================
-- DEMO TASKS
-- ============================================
INSERT INTO tasks (id, project_id, title, description, status, assignee_id, priority, workflow_position, node_type)
VALUES 
    -- Project 1 Tasks
    ('d0000000-0000-0000-0000-000000000001',
     'c0000000-0000-0000-0000-000000000001',
     'Design database schema for products and orders',
     'Create comprehensive database schema including products, orders, users, and inventory tables with proper indexes.',
     'completed',
     'b0000000-0000-0000-0000-000000000003',
     'P0',
     '{"column": "done", "order": 1}',
     'task'),
    
    ('d0000000-0000-0000-0000-000000000002',
     'c0000000-0000-0000-0000-000000000001',
     'Implement user authentication API',
     'Build JWT-based authentication system with login, register, and password reset endpoints.',
     'completed',
     'b0000000-0000-0000-0000-000000000003',
     'P0',
     '{"column": "done", "order": 2}',
     'task'),
    
    ('d0000000-0000-0000-0000-000000000003',
     'c0000000-0000-0000-0000-000000000001',
     'Build product catalog frontend',
     'Create React components for product listing, search, filters, and product detail pages.',
     'running',
     'b0000000-0000-0000-0000-000000000003',
     'P1',
     '{"column": "in_progress", "order": 1}',
     'task'),
    
    ('d0000000-0000-0000-0000-000000000004',
     'c0000000-0000-0000-0000-000000000001',
     'Implement shopping cart functionality',
     'Develop shopping cart with add/remove/update quantities and persist to database.',
     'pending',
     'b0000000-0000-0000-0000-000000000003',
     'P1',
     '{"column": "todo", "order": 1}',
     'task'),
    
    ('d0000000-0000-0000-0000-000000000005',
     'c0000000-0000-0000-0000-000000000001',
     'Code review for checkout flow',
     'Review the checkout process implementation for security and performance issues.',
     'pending',
     'b0000000-0000-0000-0000-000000000004',
     'P1',
     '{"column": "todo", "order": 2}',
     'task'),
    
    -- Project 2 Tasks
    ('d0000000-0000-0000-0000-000000000006',
     'c0000000-0000-0000-0000-000000000002',
     'API endpoint documentation',
     'Create OpenAPI/Swagger documentation for all mobile API endpoints.',
     'completed',
     'b0000000-0000-0000-0000-000000000003',
     'P1',
     '{"column": "done", "order": 1}',
     'task'),
    
    ('d0000000-0000-0000-0000-000000000007',
     'c0000000-0000-0000-0000-000000000002',
     'Implement push notification service',
     'Build FCM-based push notification system for iOS and Android.',
     'running',
     'b0000000-0000-0000-0000-000000000003',
     'P0',
     '{"column": "in_progress", "order": 1}',
     'task'),
    
    ('d0000000-0000-0000-0000-000000000008',
     'c0000000-0000-0000-0000-000000000002',
     'Security audit for authentication',
     'Perform penetration testing and security audit on auth endpoints.',
     'pending',
     'b0000000-0000-0000-0000-000000000004',
     'P0',
     '{"column": "todo", "order": 1}',
     'task'),
    
    -- Project 3 Tasks
    ('d0000000-0000-0000-0000-000000000009',
     'c0000000-0000-0000-0000-000000000003',
     'Setup data pipeline for analytics',
     'Build ETL pipeline to ingest and transform data from multiple sources.',
     'completed',
     'b0000000-0000-0000-0000-000000000003',
     'P0',
     '{"column": "done", "order": 1}',
     'task'),
    
    ('d0000000-0000-0000-0000-000000000010',
     'c0000000-0000-0000-0000-000000000003',
     'Create dashboard visualizations',
     'Build interactive charts using D3.js for revenue, users, and conversion metrics.',
     'running',
     'b0000000-0000-0000-0000-000000000003',
     'P1',
     '{"column": "in_progress", "order": 1}',
     'task'),
    
    ('d0000000-0000-0000-0000-000000000011',
     'c0000000-0000-0000-0000-000000000003',
     'Write integration tests for API',
     'Create automated tests for all dashboard API endpoints with 80%+ coverage.',
     'pending',
     'b0000000-0000-0000-0000-000000000005',
     'P2',
     '{"column": "todo", "order": 1}',
     'task'),
    
    ('d0000000-0000-0000-0000-000000000012',
     'c0000000-0000-0000-0000-000000000003',
     'Setup production deployment',
     'Configure Kubernetes deployment with auto-scaling and monitoring.',
     'pending',
     'b0000000-0000-0000-0000-000000000006',
     'P1',
     '{"column": "todo", "order": 2}',
     'task')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DEMO REQUIREMENTS
-- ============================================
INSERT INTO requirements (id, project_id, title, description, status, priority)
VALUES
    ('e0000000-0000-0000-0000-000000000001',
     'c0000000-0000-0000-0000-000000000001',
     'Guest checkout without registration',
     'Allow users to checkout as guests without creating an account.',
     'confirmed',
     'P1'),
    
    ('e0000000-0000-0000-0000-000000000002',
     'c0000000-0000-0000-0000-000000000001',
     'Multiple payment methods',
     'Support credit card, PayPal, and Apple Pay.',
     'confirmed',
     'P0'),
    
    ('e0000000-0000-0000-0000-000000000003',
     'c0000000-0000-0000-0000-000000000002',
     'Rate limiting on API',
     'Implement rate limiting to prevent API abuse.',
     'pending',
     'P1')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- UPDATE AGENT TASK COUNTS
-- ============================================
UPDATE agents SET task_count = (
    SELECT COUNT(*) FROM tasks WHERE assignee_id = agents.id
);
