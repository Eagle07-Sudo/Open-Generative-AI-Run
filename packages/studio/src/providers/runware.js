import {
  buildImageTask,
  buildI2ITask,
  buildVideoTask,
  buildI2VTask,
  buildV2VTask,
  buildAudioTask,
} from './runwareTaskBuilder.js';
import {
  getT2iModelById,
  getI2iModelById,
  getI2vModelById,
  getV2vModelById,
  getModelByIdForStudio,
} from '../modelRegistry.js';
import {
  postTasks,
  extractImageFromResponse,
  pollImageResponse,
  pollVideoResponse,
} from './runwareClient.js';
import { assertRunwareImagePayload } from './runwareImagePayload.js';
import { supportsStudioOp } from './capabilities.js';
import { uploadFile } from './runwareUpload.js';

export const id = 'runware';

export { supportsStudioOp, uploadFile };

/**
 * @param {string} op
 */
export function supports(op) {
  return supportsStudioOp('runware', op);
}

/**
 * @param {string} apiKey
 * @param {import('./types.js').GenerateImageParams} params
 */
export async function generateImage(apiKey, params) {
  const catalog = getT2iModelById(params.model, 'runware');
  const taskUUID = crypto.randomUUID();
  const hasRefs = Boolean(params.image_url || params.images_list?.length);
  const task = hasRefs
    ? buildI2ITask(getI2iModelById(params.model, 'runware') || catalog, params, taskUUID)
    : buildImageTask(catalog, params, taskUUID);

  assertRunwareImagePayload(task);

  if (params.onRequestId) params.onRequestId(taskUUID);

  try {
    const body = await postTasks(apiKey, [task]);
    return extractImageFromResponse(body, taskUUID);
  } catch (syncErr) {
    const msg = syncErr.message || '';
    const status = syncErr.status;
    if (status === 401 || status === 403) throw syncErr;

    const shouldRetryAsync =
      msg.includes('timeout') ||
      msg.includes('timed out') ||
      msg.includes('async') ||
      msg.includes('504') ||
      msg.includes('No image');

    if (!shouldRetryAsync) throw syncErr;

    await postTasks(apiKey, [{ ...task, deliveryMethod: 'async' }]);
    return pollImageResponse(apiKey, taskUUID);
  }
}

/**
 * @param {string} apiKey
 * @param {import('./types.js').GenerateImageParams & { image_url?: string, images_list?: string[] }} params
 */
export async function generateI2I(apiKey, params) {
  const catalog = getI2iModelById(params.model, 'runware');
  const taskUUID = crypto.randomUUID();
  const task = buildI2ITask(catalog, params, taskUUID);

  assertRunwareImagePayload(task);

  if (params.onRequestId) params.onRequestId(taskUUID);

  try {
    const body = await postTasks(apiKey, [task]);
    return extractImageFromResponse(body, taskUUID);
  } catch (syncErr) {
    const msg = syncErr.message || '';
    const status = syncErr.status;
    if (status === 401 || status === 403) throw syncErr;

    const shouldRetryAsync =
      msg.includes('timeout') ||
      msg.includes('timed out') ||
      msg.includes('async') ||
      msg.includes('504') ||
      msg.includes('No image');

    if (!shouldRetryAsync) throw syncErr;

    await postTasks(apiKey, [{ ...task, deliveryMethod: 'async' }]);
    return pollImageResponse(apiKey, taskUUID);
  }
}

export { formatRunwareErrorForStudio } from './runwareImagePayload.js';

/**
 * @param {string} apiKey
 * @param {{ model: string, prompt: string, aspect_ratio?: string, duration?: number, resolution?: string, onRequestId?: (id: string) => void }} params
 */
export async function generateVideo(apiKey, params) {
  const catalog = getModelByIdForStudio(params.model, 'video', 'runware');
  const taskUUID = crypto.randomUUID();
  const task = buildVideoTask(catalog, params, taskUUID);

  if (params.onRequestId) params.onRequestId(taskUUID);

  await postTasks(apiKey, [task]);
  return pollVideoResponse(apiKey, taskUUID);
}

/**
 * @param {string} apiKey
 * @param {{ model: string, prompt?: string, image_url?: string, last_image?: string, aspect_ratio?: string, duration?: number, resolution?: string, onRequestId?: (id: string) => void }} params
 */
export async function generateI2V(apiKey, params) {
  const catalog = getI2vModelById(params.model, 'runware');
  const taskUUID = crypto.randomUUID();
  const task = buildI2VTask(catalog, params, taskUUID);

  if (params.onRequestId) params.onRequestId(taskUUID);

  await postTasks(apiKey, [task]);
  return pollVideoResponse(apiKey, taskUUID);
}

/**
 * @param {string} apiKey
 * @param {{ model: string, prompt?: string, video_url: string, image_url?: string, onRequestId?: (id: string) => void }} params
 */
export async function processV2V(apiKey, params) {
  const catalog = getV2vModelById(params.model, 'runware');
  const taskUUID = crypto.randomUUID();
  const task = buildV2VTask(catalog, params, taskUUID);

  if (params.onRequestId) params.onRequestId(taskUUID);

  await postTasks(apiKey, [task]);
  return pollVideoResponse(apiKey, taskUUID);
}

/**
 * @param {string} apiKey
 * @param {{ model: string, prompt: string, onRequestId?: (id: string) => void }} params
 */
export async function generateAudio(apiKey, params) {
  const catalog = getModelByIdForStudio(params.model, 'audio', 'runware');
  const taskUUID = crypto.randomUUID();
  const task = buildAudioTask(catalog, params, taskUUID);

  if (params.onRequestId) params.onRequestId(taskUUID);

  const body = await postTasks(apiKey, [task]);
  const items = body?.data || [];
  const match = items.find((i) => i.taskUUID === taskUUID) || items[0];
  const url = match?.audioURL || match?.url;
  if (!url) {
    await new Promise((r) => setTimeout(r, 2000));
    const polled = await postTasks(apiKey, [{ taskType: 'getResponse', taskUUID }]);
    const item = (polled?.data || [])[0];
    const polledUrl = item?.audioURL || item?.url;
    if (!polledUrl) throw new Error('No audio URL in Runware response');
    return { ok: true, url: polledUrl, id: taskUUID };
  }
  return { ok: true, url, id: taskUUID };
}
