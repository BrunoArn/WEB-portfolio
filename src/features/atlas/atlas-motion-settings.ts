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