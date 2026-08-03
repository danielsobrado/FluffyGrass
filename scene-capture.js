import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.module.js";

const originalAdd = THREE.Object3D.prototype.add;

THREE.Object3D.prototype.add = function (...objects) {
  const result = originalAdd.apply(this, objects);
  if (this instanceof THREE.Scene) {
    window.__drusnielScene = this;
  }
  return result;
};
