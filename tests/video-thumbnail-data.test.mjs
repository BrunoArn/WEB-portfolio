import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createTypeScriptLoader} from './helpers/load-typescript.mjs';
const {load}=createTypeScriptLoader();const {adaptProjectVideo}=load(fileURLToPath(new URL('../src/content/adapters/media.ts',import.meta.url)));
const video=()=>({_type:'projectVideo',video:{asset:{_id:'file-video',url:'video.mp4'}}});
test('Legacy video data remains unchanged until a persistent thumbnail exists',()=>{assert.deepEqual(adaptProjectVideo(video()),{id:'file-video',type:'video',src:'video.mp4'});});
test('A persisted thumbnail preserves video identity and source',()=>{const raw=video();raw.video.asset.thumbnail={_id:'image-frame',url:'frame.webp'};assert.deepEqual(adaptProjectVideo(raw),{id:'file-video',type:'video',src:'video.mp4',thumbnail:'frame.webp'});});
test('Missing, deleted or malformed thumbnails safely retain the existing play fallback',()=>{for(const thumbnail of [null,{}, {_id:'',url:'frame.webp'},{_id:'image-frame',url:''}]){const raw=video();raw.video.asset.thumbnail=thumbnail;assert.equal(adaptProjectVideo(raw).thumbnail,undefined);}});
