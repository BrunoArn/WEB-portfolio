export interface AtlasMotionSettings {
  enabled: boolean;
  breath: number;
  pressure: number;
  returnTime: number;
  mouseRadius: number;
  selectionStrength: number;
}

export const atlasMotionReference: AtlasMotionSettings = {
  enabled: true, breath: 90, pressure: 85, mouseRadius: 65, returnTime: 86, selectionStrength: 75,
};
export const atlasSelectionDuration = 1.15;
/** Touch sampling is bounded; strand cooldown/slots still limit energy. */
export const atlasTouchReference = {
  tapSlop: 10, tapDuration: 350, sampleInterval: 16,
  maximumSpeed: 650, pressureGain: .65, idleTimeout: 120,
};
