/**
 * API Keys Routes
 * API key management with provider presets for UI templates
 * 
 * Uses Prisma ORM for database operations (api_keys is a Prisma-managed model)
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';
import {
  getProviderById,
  listProviders,
  validateApiKeyFormat,
  getDefaultModel,
  getProviderGroups,
} from '../lib/api-providers.js';

const router = Router();

router.use(authenticate);

// ============================================
// GET /api/api-keys/providers - List all provider presets
// ============================================
router.get('/providers', asyncHandler(async (req, res) => {
  const { group } = req.query;

  if (group === 'international') {
    return res.json({ success: true, data: getProviderGroups().international });
  }
  if (group === 'domestic') {
    return res.json({ success: true, data: getProviderGroups().domestic });
  }
  if (group === 'all') {
    return res.json({ success: true, data: getProviderGroups() });
  }

  const providers = listProviders();
  res.json({ success: true, data: providers });
}));

// ============================================
// GET /api/api-keys/providers/:id - Get provider details with models
// ============================================
router.get('/providers/:id', asyncHandler(async (req, res) => {
  const provider = getProviderById(req.params.id);
  if (!provider) {
    throw new NotFoundError('Provider not found');
  }

  res.json({
    success: true,
    data: {
      id: provider.id,
      name: provider.name,
      name_zh: provider.name_zh,
      icon: provider.icon,
      color: provider.color,
      website: provider.website,
      description: provider.description,
      description_zh: provider.description_zh,
      base_url: provider.base_url,
      docs_url: provider.docs_url,
      key_format: provider.key_format,
      auth_mode: provider.auth_mode,
      auth_note: provider.auth_note,
      additional_auth: provider.additional_auth,
      models: provider.models.map(m => ({
        id: m.id,
        name: m.name,
        name_zh: m.name_zh,
        description: m.description,
        description_zh: m.description_zh,
        context_window: m.context_window,
        input_price_per_1m: m.input_price_per_1m,
        output_price_per_1m: m.output_price_per_1m,
        currency: m.currency,
        price_cny_note: m.price_cny_note,
      })),
    },
  });
}));

// ============================================
// GET /api/api-keys - List all API keys
// ============================================
router.get('/', asyncHandler(async (req, res) => {
  const { provider, status } = req.query;

  const where = {};
  if (provider) where.provider = provider;
  if (status) where.status = status;

  const apiKeys = await prisma.apiKey.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  // Mask the actual keys (only return prefix for security)
  const masked = apiKeys.map(k => ({
    ...k,
    key: k.prefix,
  }));

  res.json({ success: true, data: masked });
}));

// ============================================
// GET /api/api-keys/:id - Get API key details
// ============================================
router.get('/:id', asyncHandler(async (req, res) => {
  const apiKey = await prisma.apiKey.findUnique({ where: { id: req.params.id } });

  if (!apiKey) {
    throw new NotFoundError('API key not found');
  }

  const provider = getProviderById(apiKey.provider);
  const model = provider?.models.find(m => m.id === apiKey.model);

  res.json({
    success: true,
    data: {
      ...apiKey,
      key: apiKey.prefix,
      provider_info: provider ? {
        id: provider.id,
        name: provider.name,
        name_zh: provider.name_zh,
        icon: provider.icon,
        color: provider.color,
      } : null,
      model_info: model ? {
        id: model.id,
        name: model.name,
        name_zh: model.name_zh,
        context_window: model.context_window,
      } : null,
    },
  });
}));

// ============================================
// POST /api/api-keys - Create a new API key
// ============================================
router.post('/', asyncHandler(async (req, res) => {
  const { name, provider, model, key } = req.body;

  if (!name || !name.trim()) {
    throw new BadRequestError('Name is required');
  }
  if (!provider) {
    throw new BadRequestError('Provider is required');
  }
  if (!key || !key.trim()) {
    throw new BadRequestError('API key is required');
  }

  // Validate provider exists
  const providerConfig = getProviderById(provider);
  if (!providerConfig) {
    throw new BadRequestError(`Unknown provider: ${provider}`);
  }

  // Validate key format
  const validation = validateApiKeyFormat(provider, key);
  if (!validation.valid) {
    throw new BadRequestError(validation.message);
  }

  // Resolve model
  const modelId = model || getDefaultModel(provider);
  if (!modelId) {
    throw new BadRequestError('Model is required');
  }

  // Verify model belongs to provider
  const modelConfig = providerConfig.models.find(m => m.id === modelId);
  if (!modelConfig) {
    throw new BadRequestError(`Model ${modelId} not found in provider ${provider}`);
  }

  const prefix = providerConfig.key_format.prefix;

  const apiKey = await prisma.apiKey.create({
    data: {
      name: name.trim(),
      key: key.trim(),
      prefix: prefix + 'xxx',
      provider,
      model: modelId,
      status: 'active',
    },
  });

  res.status(201).json({
    success: true,
    data: { ...apiKey, key: apiKey.prefix },
  });
}));

// ============================================
// PUT /api/api-keys/:id - Update API key
// ============================================
router.put('/:id', asyncHandler(async (req, res) => {
  const { name, provider, model, key, status } = req.body;

  const existing = await prisma.apiKey.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    throw new NotFoundError('API key not found');
  }

  const updates = {};

  if (name !== undefined) {
    if (!name.trim()) throw new BadRequestError('Name cannot be empty');
    updates.name = name.trim();
  }

  if (provider !== undefined) {
    const newProvider = getProviderById(provider);
    if (!newProvider) throw new BadRequestError(`Unknown provider: ${provider}`);
    updates.provider = provider;
  }

  if (model !== undefined) {
    updates.model = model;
  }

  if (key !== undefined && key.trim() !== '') {
    const providerToValidate = provider || existing.provider;
    const validation = validateApiKeyFormat(providerToValidate, key);
    if (!validation.valid) {
      throw new BadRequestError(validation.message);
    }
    const prov = getProviderById(providerToValidate);
    updates.key = key.trim();
    updates.prefix = prov.key_format.prefix + 'xxx';
  }

  if (status !== undefined) {
    const validStatuses = ['active', 'revoked', 'expired'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    updates.status = status;
  }

  if (Object.keys(updates).length === 0) {
    throw new BadRequestError('No fields to update');
  }

  const updated = await prisma.apiKey.update({
    where: { id: req.params.id },
    data: updates,
  });

  res.json({
    success: true,
    data: { ...updated, key: updated.prefix },
  });
}));

// ============================================
// DELETE /api/api-keys/:id - Delete API key
// ============================================
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    await prisma.apiKey.delete({ where: { id: req.params.id } });
  } catch (error) {
    if (error.code === 'P2025') {
      throw new NotFoundError('API key not found');
    }
    throw error;
  }

  res.json({ success: true, message: 'API key deleted successfully' });
}));

export default router;
