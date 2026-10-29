export type AtlasRegionShape = 'custom' | 'rounded' | 'elongated' | 'band';
export interface AtlasRegionProfile {
  enabled: boolean; shape: AtlasRegionShape;
  x: number; y: number; width: number; height: number; rotation: number; intensity: number;
}
export interface AtlasCompositionRegion {
  _key: string; _type: 'atlasCompositionRegion'; name: string; kind: 'elevation' | 'valley';
  desktop: AtlasRegionProfile; mobile: AtlasRegionProfile;
}
export interface AtlasRegionSource {
  _key?: string; name?: string; kind?: string;
  desktop?: Partial<AtlasRegionProfile> | null; mobile?: Partial<AtlasRegionProfile> | null;
}
const profile = (x: number, y: number, width: number, height: number, intensity: number, rotation = 0): AtlasRegionProfile =>
  ({enabled: true, shape: 'custom', x, y, width, height, intensity, rotation});
const off = (): AtlasRegionProfile => ({...profile(50,50,20,10,.3), enabled: false});

/** Desktop reference and lateral mobile composition, using additive/subtractive sources. */
export function atlasReferenceRegions(): AtlasCompositionRegion[] {
  const tilt = -.3 * 180 / Math.PI;
  const valley = .3 + .55 * .55;
  const rows: [string,string,'elevation'|'valley',AtlasRegionProfile,AtlasRegionProfile][] = [
    ['ridge-games','Faixa entre os jogos','elevation',profile(43,41,23,11,.42,tilt),profile(48,37,55,4.8,.28,-3)],
    ['ridge-interactive','Faixa interativa inferior','elevation',profile(49,76,26,12,.35,tilt),profile(50,83,62,5.2,.32,3)],
    ['ridge-web','Arco superior e região Web','elevation',profile(94,13,20,16,.65,tilt),profile(52,60,58,4.6,.27,-2)],
    ['ridge-edge','Entrada pela borda inferior esquerda','elevation',profile(-8,96,24,17,.8,tilt),off()],
    ['valley-intro','Respiro superior / lateral esquerda','valley',profile(15,18,26,23,valley),profile(-5,53,32,3.2,.48,-3)],
    ['valley-center','Vale central / lateral direita','valley',profile(55,62,16,8,valley),profile(108,49,32,3.4,.48,3)],
    ['valley-right','Respiro da borda direita','valley',profile(92,87,15,12,valley),profile(105,31,30,3.5,.42,-3)],
    ['valley-bottom','Respiro inferior do celular','valley',off(),profile(-8,86,30,3.4,.42,2)],
  ];
  return rows.map(([_key,name,kind,desktop,mobile]) => ({_key,_type:'atlasCompositionRegion',name,kind,desktop,mobile}));
}
function finite(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}
export function resolveAtlasRegionProfile(value: Partial<AtlasRegionProfile> | null | undefined, mobile: boolean): AtlasRegionProfile | null {
  if (!value || value.enabled === false) return off();
  const shape = value.shape ?? 'custom';
  if (!['custom','rounded','elongated','band'].includes(shape)) return null;
  let width = value.width, height = value.height;
  if (shape === 'rounded') { width = mobile ? 18 : 13; height = mobile ? 18 * 390 / 1160 : 13 * 1440 / 790; }
  if (shape === 'elongated') { width = mobile ? 16 : 23; height = mobile ? 12 : 11; }
  if (shape === 'band') { width = mobile ? 15 : 35; height = mobile ? 20 : 8; }
  if (!finite(value.x,-50,150) || !finite(value.y,-50,150) || !finite(width,.1,100) || !finite(height,.1,100) || !finite(value.intensity,0,2) || !finite(value.rotation ?? 0,-180,180)) return null;
  return {enabled:true,shape,x:value.x,y:value.y,width,height,intensity:value.intensity,rotation:value.rotation ?? 0};
}
export function resolveAtlasRegions(value?: readonly AtlasRegionSource[] | null): AtlasCompositionRegion[] {
  if (value == null) return atlasReferenceRegions();
  if (!Array.isArray(value)) return [];
  const keys = new Set<string>();
  return value.flatMap(row => {
    if (!row._key || keys.has(row._key) || (row.kind !== 'elevation' && row.kind !== 'valley')) return [];
    keys.add(row._key);
    const desktop = resolveAtlasRegionProfile(row.desktop,false), mobile = resolveAtlasRegionProfile(row.mobile,true);
    if (!desktop || !mobile) return [];
    return [{_key:row._key,_type:'atlasCompositionRegion' as const,name:row.name?.trim() || 'Região sem nome',kind:row.kind,desktop,mobile}];
  });
}
