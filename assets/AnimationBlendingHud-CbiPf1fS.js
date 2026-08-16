var m=Object.defineProperty;var b=(r,e,i)=>e in r?m(r,e,{enumerable:!0,configurable:!0,writable:!0,value:i}):r[e]=i;var a=(r,e,i)=>b(r,typeof e!="symbol"?e+"":e,i);import{A as u,a as g,b as p,c as v}from"./HumanoidAdditiveLayer-DfKsmN7z.js";class y{constructor(){a(this,"container");a(this,"panel");a(this,"toggleBtn");a(this,"character",null);a(this,"autoLocomotion",!0);a(this,"crossfadeTarget",null);a(this,"crossfadeDuration",.5);a(this,"crossfadeElapsed",0);a(this,"crossfadeStartWeights",{idle:1,walk:0,run:0});a(this,"crossfadeTargetWeights",{idle:1,walk:0,run:0});a(this,"idleSlider");a(this,"walkSlider");a(this,"runSlider");a(this,"idleValSpan");a(this,"walkValSpan");a(this,"runValSpan");a(this,"sneakSlider");a(this,"sadSlider");a(this,"agreeSlider");a(this,"headShakeSlider");a(this,"sneakValSpan");a(this,"sadValSpan");a(this,"agreeValSpan");a(this,"headShakeValSpan");a(this,"autoBtn");a(this,"disposed",!1);a(this,"handleKeyDown",e=>{var i,d;if(e.key.toLowerCase()==="b"&&!e.ctrlKey&&!e.metaKey&&!e.altKey){if(((i=document.activeElement)==null?void 0:i.tagName)==="INPUT"||((d=document.activeElement)==null?void 0:d.tagName)==="TEXTAREA")return;this.toggleVisibility()}});this.container=document.createElement("div"),this.container.className="animation-blending-hud",this.container.id="animation-blending-hud",this.toggleBtn=document.createElement("button"),this.toggleBtn.className="anim-hud-toggle",this.toggleBtn.textContent="Animations (B)",this.toggleBtn.title="Toggle Animation Blending Panel (Key: B)",this.panel=document.createElement("div"),this.panel.className="anim-hud-panel",this.buildPanelDom(),this.container.appendChild(this.toggleBtn),this.container.appendChild(this.panel),document.body.appendChild(this.container),this.bindEvents()}attachCharacter(e){this.character=e}update(e){if(this.disposed||!this.character)return;if(this.crossfadeTarget!==null&&this.crossfadeDuration>0){this.crossfadeElapsed+=e;const n=Math.min(1,this.crossfadeElapsed/this.crossfadeDuration),l=n*n*(3-2*n),o=this.crossfadeStartWeights.idle+(this.crossfadeTargetWeights.idle-this.crossfadeStartWeights.idle)*l,c=this.crossfadeStartWeights.walk+(this.crossfadeTargetWeights.walk-this.crossfadeStartWeights.walk)*l,S=this.crossfadeStartWeights.run+(this.crossfadeTargetWeights.run-this.crossfadeStartWeights.run)*l;this.character.setExplicitLocomotionWeights({idle:o,walk:c,run:S}),n>=1&&(this.crossfadeTarget=null)}const i=this.character.getLocomotionBlendWeights();this.autoLocomotion&&this.crossfadeTarget===null&&(this.idleSlider.value=i.idle.toFixed(2),this.walkSlider.value=i.walk.toFixed(2),this.runSlider.value=i.run.toFixed(2)),this.idleValSpan.textContent=i.idle.toFixed(2),this.walkValSpan.textContent=i.walk.toFixed(2),this.runValSpan.textContent=i.run.toFixed(2);const d=this.character.getAdditiveWeight(u),h=this.character.getAdditiveWeight(g),t=this.character.getAdditiveWeight(p),s=this.character.getAdditiveWeight(v);this.sneakSlider.value=d.toFixed(2),this.sadSlider.value=h.toFixed(2),this.agreeSlider.value=t.toFixed(2),this.headShakeSlider.value=s.toFixed(2),this.sneakValSpan.textContent=d.toFixed(2),this.sadValSpan.textContent=h.toFixed(2),this.agreeValSpan.textContent=t.toFixed(2),this.headShakeValSpan.textContent=s.toFixed(2)}dispose(){this.disposed||(this.disposed=!0,window.removeEventListener("keydown",this.handleKeyDown),this.container.remove())}buildPanelDom(){this.panel.innerHTML=`
      <div class="anim-panel-header">
        <strong>🎭 Skeletal Blending & Additives</strong>
        <button type="button" class="anim-panel-close" title="Close">✕</button>
      </div>

      <div class="anim-section">
        <div class="anim-section-title">
          <span>Base Locomotion Blending</span>
          <button type="button" class="anim-auto-btn" data-auto="true">Auto (Speed)</button>
        </div>
        <div class="anim-slider-row">
          <label>Idle <span class="val" data-idle-val>1.00</span></label>
          <input type="range" min="0" max="1" step="0.01" value="1" data-idle-slider />
        </div>
        <div class="anim-slider-row">
          <label>Walk <span class="val" data-walk-val>0.00</span></label>
          <input type="range" min="0" max="1" step="0.01" value="0" data-walk-slider />
        </div>
        <div class="anim-slider-row">
          <label>Run <span class="val" data-run-val>0.00</span></label>
          <input type="range" min="0" max="1" step="0.01" value="0" data-run-slider />
        </div>
        <div class="anim-btn-group">
          <button type="button" data-fade="idle">Fade to Idle</button>
          <button type="button" data-fade="walk">Fade to Walk</button>
          <button type="button" data-fade="run">Fade to Run</button>
        </div>
      </div>

      <div class="anim-section">
        <div class="anim-section-title">
          <span>Additive Animation Layers</span>
          <button type="button" class="anim-reset-additive-btn">Reset All</button>
        </div>
        <div class="anim-slider-row">
          <div class="anim-slider-header">
            <label>Sneak Pose <span class="val" data-sneak-val>0.00</span></label>
            <button type="button" class="anim-quick-toggle" data-toggle-additive="sneak_pose">Toggle</button>
          </div>
          <input type="range" min="0" max="1" step="0.01" value="0" data-sneak-slider />
        </div>
        <div class="anim-slider-row">
          <div class="anim-slider-header">
            <label>Sad Pose <span class="val" data-sad-val>0.00</span></label>
            <button type="button" class="anim-quick-toggle" data-toggle-additive="sad_pose">Toggle</button>
          </div>
          <input type="range" min="0" max="1" step="0.01" value="0" data-sad-slider />
        </div>
        <div class="anim-slider-row">
          <div class="anim-slider-header">
            <label>Agree (Head Nod) <span class="val" data-agree-val>0.00</span></label>
            <button type="button" class="anim-quick-toggle" data-toggle-additive="agree">Toggle</button>
          </div>
          <input type="range" min="0" max="1" step="0.01" value="0" data-agree-slider />
        </div>
        <div class="anim-slider-row">
          <div class="anim-slider-header">
            <label>Head Shake <span class="val" data-headshake-val>0.00</span></label>
            <button type="button" class="anim-quick-toggle" data-toggle-additive="headShake">Toggle</button>
          </div>
          <input type="range" min="0" max="1" step="0.01" value="0" data-headshake-slider />
        </div>
      </div>

      <div class="anim-section">
        <div class="anim-section-title">
          <span>Stance & Actions</span>
        </div>
        <div class="anim-btn-group">
          <button type="button" data-action="crouch">Crouch [C]</button>
          <button type="button" data-action="roll">Dodge Roll [R]</button>
          <button type="button" data-action="look">Look Camera</button>
        </div>
      </div>
    `,this.idleSlider=this.panel.querySelector("[data-idle-slider]"),this.walkSlider=this.panel.querySelector("[data-walk-slider]"),this.runSlider=this.panel.querySelector("[data-run-slider]"),this.idleValSpan=this.panel.querySelector("[data-idle-val]"),this.walkValSpan=this.panel.querySelector("[data-walk-val]"),this.runValSpan=this.panel.querySelector("[data-run-val]"),this.sneakSlider=this.panel.querySelector("[data-sneak-slider]"),this.sadSlider=this.panel.querySelector("[data-sad-slider]"),this.agreeSlider=this.panel.querySelector("[data-agree-slider]"),this.headShakeSlider=this.panel.querySelector("[data-headshake-slider]"),this.sneakValSpan=this.panel.querySelector("[data-sneak-val]"),this.sadValSpan=this.panel.querySelector("[data-sad-val]"),this.agreeValSpan=this.panel.querySelector("[data-agree-val]"),this.headShakeValSpan=this.panel.querySelector("[data-headshake-val]"),this.autoBtn=this.panel.querySelector(".anim-auto-btn")}bindEvents(){this.toggleBtn.addEventListener("click",()=>{this.toggleVisibility()});const e=this.panel.querySelector(".anim-panel-close");e==null||e.addEventListener("click",()=>{this.toggleVisibility(!1)});const i=()=>{var l;this.autoLocomotion=!1,this.crossfadeTarget=null,this.autoBtn.classList.remove("active");const t=parseFloat(this.idleSlider.value),s=parseFloat(this.walkSlider.value),n=parseFloat(this.runSlider.value);(l=this.character)==null||l.setExplicitLocomotionWeights({idle:t,walk:s,run:n})};this.idleSlider.addEventListener("input",i),this.walkSlider.addEventListener("input",i),this.runSlider.addEventListener("input",i),this.autoBtn.addEventListener("click",()=>{var t;this.autoLocomotion=!0,this.crossfadeTarget=null,this.autoBtn.classList.add("active"),(t=this.character)==null||t.setExplicitLocomotionWeights(null)}),this.panel.querySelectorAll("[data-fade]").forEach(t=>{t.addEventListener("click",()=>{const s=t.dataset.fade;this.beginCrossfade(s)})}),this.sneakSlider.addEventListener("input",()=>{var t;(t=this.character)==null||t.setAdditiveWeight(u,parseFloat(this.sneakSlider.value))}),this.sadSlider.addEventListener("input",()=>{var t;(t=this.character)==null||t.setAdditiveWeight(g,parseFloat(this.sadSlider.value))}),this.agreeSlider.addEventListener("input",()=>{var t;(t=this.character)==null||t.setAdditiveWeight(p,parseFloat(this.agreeSlider.value))}),this.headShakeSlider.addEventListener("input",()=>{var t;(t=this.character)==null||t.setAdditiveWeight(v,parseFloat(this.headShakeSlider.value))}),this.panel.querySelectorAll("[data-toggle-additive]").forEach(t=>{t.addEventListener("click",()=>{var o,c;const s=t.dataset.toggleAdditive,l=(((o=this.character)==null?void 0:o.getAdditiveWeight(s))??0)>.4?0:1;(c=this.character)==null||c.fadeAdditiveWeight(s,l,.35)})});const d=this.panel.querySelector(".anim-reset-additive-btn");d==null||d.addEventListener("click",()=>{var t,s,n,l;(t=this.character)==null||t.fadeAdditiveWeight(u,0,.3),(s=this.character)==null||s.fadeAdditiveWeight(g,0,.3),(n=this.character)==null||n.fadeAdditiveWeight(p,0,.3),(l=this.character)==null||l.fadeAdditiveWeight(v,0,.3)}),this.panel.querySelectorAll("[data-action]").forEach(t=>{t.addEventListener("click",()=>{const s=t.getAttribute("data-action");s==="crouch"&&this.character?this.character.setCrouch(!this.character.isCrouched()):s==="roll"&&this.character?this.character.triggerRoll():s==="look"&&this.character&&this.character.clearLookTarget()})}),window.addEventListener("keydown",this.handleKeyDown)}toggleVisibility(e){(e!==void 0?e:!this.panel.classList.contains("visible"))?(this.panel.classList.add("visible"),this.toggleBtn.classList.add("active")):(this.panel.classList.remove("visible"),this.toggleBtn.classList.remove("active"))}beginCrossfade(e){if(!this.character)return;this.autoLocomotion=!1,this.autoBtn.classList.remove("active");const i=this.character.getLocomotionBlendWeights();this.crossfadeStartWeights={...i},this.crossfadeTargetWeights={idle:e==="idle"?1:0,walk:e==="walk"?1:0,run:e==="run"?1:0},this.crossfadeTarget=e,this.crossfadeDuration=.5,this.crossfadeElapsed=0}}export{y as AnimationBlendingHud};
