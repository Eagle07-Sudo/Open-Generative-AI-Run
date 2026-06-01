import * as muapi from '../muapi.js';
import { supportsStudioOp } from './capabilities.js';

export const id = 'muapi';

export const {
  generateImage,
  generateI2I,
  uploadFile,
  generateVideo,
  generateI2V,
  processV2V,
  generateAudio,
  processLipSync,
  runClipping,
  runMotionGraphics,
  runMotionGraphicsEdit,
  generateMarketingStudioAd,
} = muapi;

export function supports(op) {
  return supportsStudioOp('muapi', op);
}
