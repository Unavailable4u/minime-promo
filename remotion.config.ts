import {Config} from '@remotion/cli/config';

// Output settings shared by every render (Studio, CLI, scripts/render.mjs).
Config.setPixelFormat('yuv420p');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
