var Zr=Object.defineProperty;var jr=(e,n,t)=>n in e?Zr(e,n,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[n]=t;var Le=(e,n,t)=>jr(e,typeof n!="symbol"?n+"":n,t);import{aF as Rt,aO as Qr,aP as Ot,j as Jr,h as Ye,aQ as eo,aR as je,aS as Ve,aG as pt,aT as Fi,m as tn,aU as xi,aV as Gi,aW as Pt,ad as Je,r as ln,aX as Bt,H as Ft,aA as At,ae as En,V as Ie,aY as to,aZ as xn,U as bn,az as jt,a_ as no,X as Ht,a2 as Mi,a$ as Ze,b0 as io,a1 as In,b1 as ao,b2 as qn,a as it,aE as Gt,b3 as cn,b4 as un,b5 as Mn,b6 as nn,b7 as ro,aD as dr,b8 as an,u as _t,y as Tn,aj as ye,b9 as oo,aC as Yt,ba as Oi,bb as so,bc as lo,bd as hn,be as co,bf as fo,bg as uo,bh as po,bi as ho,bj as mo,bk as _o,bl as go,bm as vo,bn as So,bo as Eo,bp as xo,bq as Mo,br as To,bs as Ao,x as bo,w as mi,s as Yn,N as Dn,t as Ro,v as Jt,bt as Co,bu as Do,bv as Ti,bw as Po,bx as Ai,by as Lo,bz as wo,bA as Uo,P as Io,bB as No,bC as yo,aJ as Vt,B as Nn,aN as yn,bD as Fo,bE as Wt,bF as gn,bG as Kt,bH as Go,bI as pr,bJ as hr,bK as mr,bL as On,bM as _r,bN as gr,bO as vr,bP as bi,bQ as An,bR as dn,at as Ri,J as Oo,bS as Bo,bT as Ho,bU as Vo,bV as Wo,bW as Sr,bX as zo,bY as ko,bZ as Xo,b_ as Kn,b$ as $n,c0 as Zn,c1 as jn,c2 as Bi,c3 as Hi,c4 as Vi,c5 as Wi,c6 as zi,c7 as ki,c8 as Xi,c9 as qi,ca as Yi,cb as _i,cc as Ki,cd as $i,ce as Zi,cf as ji,cg as Qi,ch as Ji,ci as ea,cj as ta,ck as na,cl as ia,cm as aa,cn as ra,co as oa,cp as sa,cq as la,cr as ca,cs as fa,ct as ua,cu as da,cv as pa,cw as gi,cx as ha,cy as qo,cz as Yo,cA as Ko,cB as $o,cC as Zo,cD as jo,cE as Qo,cF as Jo,cG as ma,cH as es,cI as Fn,cJ as ts,cK as _a,cL as ga,cM as va,cN as Er,aI as ns,cO as Hn,cP as Sa,cQ as is,cR as xr,cS as vi,cT as Mr,cU as as,cV as Tr,cW as Ar,cX as br,al as Rr,cY as Cr,cZ as Dr,c_ as Pr,i as Lr,c$ as Ea,d0 as wr,d1 as Qn,d2 as Jn,d3 as rs,d4 as os,d5 as xa,d6 as xt,d7 as ss,d8 as ls,d9 as cs,da as fs,db as us,dc as ds,a9 as ps,dd as hs,de as ms,df as _s,aK as gs,n as ei,b as Dt,an as vs,aB as Ss}from"./three.core-DcZEDKaF.js";import{F as Es,b as xs,P as mt,c as Ms,a as qt,N as It,U as Ts}from"./index-DtwLg4dH.js";import{b as As,G as Vn,c as bs}from"./GrassBiomeProfile-BKhiJgXH.js";/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function Ur(){let e=null,n=!1,t=null,i=null;function a(o,s){t(o,s),i=e.requestAnimationFrame(a)}return{start:function(){n!==!0&&t!==null&&e!==null&&(i=e.requestAnimationFrame(a),n=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(i),n=!1},setAnimationLoop:function(o){t=o},setContext:function(o){e=o}}}function Rs(e){const n=new WeakMap;function t(d,M){const g=d.array,F=d.usage,C=g.byteLength,h=e.createBuffer();e.bindBuffer(M,h),e.bufferData(M,g,F),d.onUploadCallback();let S;if(g instanceof Float32Array)S=e.FLOAT;else if(typeof Float16Array<"u"&&g instanceof Float16Array)S=e.HALF_FLOAT;else if(g instanceof Uint16Array)d.isFloat16BufferAttribute?S=e.HALF_FLOAT:S=e.UNSIGNED_SHORT;else if(g instanceof Int16Array)S=e.SHORT;else if(g instanceof Uint32Array)S=e.UNSIGNED_INT;else if(g instanceof Int32Array)S=e.INT;else if(g instanceof Int8Array)S=e.BYTE;else if(g instanceof Uint8Array)S=e.UNSIGNED_BYTE;else if(g instanceof Uint8ClampedArray)S=e.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+g);return{buffer:h,type:S,bytesPerElement:g.BYTES_PER_ELEMENT,version:d.version,size:C}}function i(d,M,g){const F=M.array,C=M.updateRanges;if(e.bindBuffer(g,d),C.length===0)e.bufferSubData(g,0,F);else{C.sort((S,R)=>S.start-R.start);let h=0;for(let S=1;S<C.length;S++){const R=C[h],B=C[S];B.start<=R.start+R.count+1?R.count=Math.max(R.count,B.start+B.count-R.start):(++h,C[h]=B)}C.length=h+1;for(let S=0,R=C.length;S<R;S++){const B=C[S];e.bufferSubData(g,B.start*F.BYTES_PER_ELEMENT,F,B.start,B.count)}M.clearUpdateRanges()}M.onUploadCallback()}function a(d){return d.isInterleavedBufferAttribute&&(d=d.data),n.get(d)}function o(d){d.isInterleavedBufferAttribute&&(d=d.data);const M=n.get(d);M&&(e.deleteBuffer(M.buffer),n.delete(d))}function s(d,M){if(d.isInterleavedBufferAttribute&&(d=d.data),d.isGLBufferAttribute){const F=n.get(d);(!F||F.version<d.version)&&n.set(d,{buffer:d.buffer,type:d.type,bytesPerElement:d.elementSize,version:d.version});return}const g=n.get(d);if(g===void 0)n.set(d,t(d,M));else if(g.version<d.version){if(g.size!==d.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(g.buffer,d,M),g.version=d.version}}return{get:a,remove:o,update:s}}var Cs=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Ds=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Ps=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Ls=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ws=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Us=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Is=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Ns=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,ys=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Fs=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Gs=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Os=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Bs=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Hs=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Vs=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Ws=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,zs=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,ks=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Xs=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,qs=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Ys=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Ks=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,$s=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Zs=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,js=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Qs=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Js=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,el=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,tl=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,nl=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,il="gl_FragColor = linearToOutputTexel( gl_FragColor );",al=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,rl=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,ol=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,sl=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,ll=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,cl=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fl=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,ul=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,dl=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,pl=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,hl=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,ml=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,_l=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,gl=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,vl=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Sl=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,El=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,xl=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Ml=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Tl=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Al=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,bl=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Rl=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Cl=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Dl=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Pl=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Ll=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,wl=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ul=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Il=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Nl=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,yl=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Fl=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Gl=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Ol=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Bl=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Hl=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Vl=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Wl=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,zl=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,kl=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Xl=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,ql=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Yl=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Kl=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,$l=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Zl=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,jl=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Ql=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Jl=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,ec=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,tc=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,nc=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,ic=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,ac=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,rc=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,oc=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,sc=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,lc=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,cc=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,fc=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,uc=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,dc=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,pc=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,hc=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,mc=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,_c=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,gc=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,vc=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Sc=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Ec=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,xc=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Mc=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Tc=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Ac=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,bc=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Rc=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Cc=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Dc=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Pc=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Lc=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,wc=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Uc=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ic=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Nc=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,yc=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Fc=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,Gc=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Oc=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Bc=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Hc=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Vc=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Wc=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,zc=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,kc=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Xc=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,qc=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Yc=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Kc=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,$c=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Zc=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,jc=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Qc=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Jc=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ef=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,tf=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,nf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,af=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,rf=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,of=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,we={alphahash_fragment:Cs,alphahash_pars_fragment:Ds,alphamap_fragment:Ps,alphamap_pars_fragment:Ls,alphatest_fragment:ws,alphatest_pars_fragment:Us,aomap_fragment:Is,aomap_pars_fragment:Ns,batching_pars_vertex:ys,batching_vertex:Fs,begin_vertex:Gs,beginnormal_vertex:Os,bsdfs:Bs,iridescence_fragment:Hs,bumpmap_pars_fragment:Vs,clipping_planes_fragment:Ws,clipping_planes_pars_fragment:zs,clipping_planes_pars_vertex:ks,clipping_planes_vertex:Xs,color_fragment:qs,color_pars_fragment:Ys,color_pars_vertex:Ks,color_vertex:$s,common:Zs,cube_uv_reflection_fragment:js,defaultnormal_vertex:Qs,displacementmap_pars_vertex:Js,displacementmap_vertex:el,emissivemap_fragment:tl,emissivemap_pars_fragment:nl,colorspace_fragment:il,colorspace_pars_fragment:al,envmap_fragment:rl,envmap_common_pars_fragment:ol,envmap_pars_fragment:sl,envmap_pars_vertex:ll,envmap_physical_pars_fragment:Sl,envmap_vertex:cl,fog_vertex:fl,fog_pars_vertex:ul,fog_fragment:dl,fog_pars_fragment:pl,gradientmap_pars_fragment:hl,lightmap_pars_fragment:ml,lights_lambert_fragment:_l,lights_lambert_pars_fragment:gl,lights_pars_begin:vl,lights_toon_fragment:El,lights_toon_pars_fragment:xl,lights_phong_fragment:Ml,lights_phong_pars_fragment:Tl,lights_physical_fragment:Al,lights_physical_pars_fragment:bl,lights_fragment_begin:Rl,lights_fragment_maps:Cl,lights_fragment_end:Dl,lightprobes_pars_fragment:Pl,logdepthbuf_fragment:Ll,logdepthbuf_pars_fragment:wl,logdepthbuf_pars_vertex:Ul,logdepthbuf_vertex:Il,map_fragment:Nl,map_pars_fragment:yl,map_particle_fragment:Fl,map_particle_pars_fragment:Gl,metalnessmap_fragment:Ol,metalnessmap_pars_fragment:Bl,morphinstance_vertex:Hl,morphcolor_vertex:Vl,morphnormal_vertex:Wl,morphtarget_pars_vertex:zl,morphtarget_vertex:kl,normal_fragment_begin:Xl,normal_fragment_maps:ql,normal_pars_fragment:Yl,normal_pars_vertex:Kl,normal_vertex:$l,normalmap_pars_fragment:Zl,clearcoat_normal_fragment_begin:jl,clearcoat_normal_fragment_maps:Ql,clearcoat_pars_fragment:Jl,iridescence_pars_fragment:ec,opaque_fragment:tc,packing:nc,premultiplied_alpha_fragment:ic,project_vertex:ac,dithering_fragment:rc,dithering_pars_fragment:oc,roughnessmap_fragment:sc,roughnessmap_pars_fragment:lc,shadowmap_pars_fragment:cc,shadowmap_pars_vertex:fc,shadowmap_vertex:uc,shadowmask_pars_fragment:dc,skinbase_vertex:pc,skinning_pars_vertex:hc,skinning_vertex:mc,skinnormal_vertex:_c,specularmap_fragment:gc,specularmap_pars_fragment:vc,tonemapping_fragment:Sc,tonemapping_pars_fragment:Ec,transmission_fragment:xc,transmission_pars_fragment:Mc,uv_pars_fragment:Tc,uv_pars_vertex:Ac,uv_vertex:bc,worldpos_vertex:Rc,background_vert:Cc,background_frag:Dc,backgroundCube_vert:Pc,backgroundCube_frag:Lc,cube_vert:wc,cube_frag:Uc,depth_vert:Ic,depth_frag:Nc,distance_vert:yc,distance_frag:Fc,equirect_vert:Gc,equirect_frag:Oc,linedashed_vert:Bc,linedashed_frag:Hc,meshbasic_vert:Vc,meshbasic_frag:Wc,meshlambert_vert:zc,meshlambert_frag:kc,meshmatcap_vert:Xc,meshmatcap_frag:qc,meshnormal_vert:Yc,meshnormal_frag:Kc,meshphong_vert:$c,meshphong_frag:Zc,meshphysical_vert:jc,meshphysical_frag:Qc,meshtoon_vert:Jc,meshtoon_frag:ef,points_vert:tf,points_frag:nf,shadow_vert:af,shadow_frag:rf,sprite_vert:of,sprite_frag:sf},le={common:{diffuse:{value:new Ye(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new ye},alphaMap:{value:null},alphaMapTransform:{value:new ye},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new ye}},envmap:{envMap:{value:null},envMapRotation:{value:new ye},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new ye}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new ye}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new ye},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new ye},normalScale:{value:new it(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new ye},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new ye}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new ye}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new ye}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ye(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new Ie},probesMax:{value:new Ie},probesResolution:{value:new Ie}},points:{diffuse:{value:new Ye(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new ye},alphaTest:{value:0},uvTransform:{value:new ye}},sprite:{diffuse:{value:new Ye(16777215)},opacity:{value:1},center:{value:new it(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new ye},alphaMap:{value:null},alphaMapTransform:{value:new ye},alphaTest:{value:0}}},yt={basic:{uniforms:xt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.fog]),vertexShader:we.meshbasic_vert,fragmentShader:we.meshbasic_frag},lambert:{uniforms:xt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new Ye(0)},envMapIntensity:{value:1}}]),vertexShader:we.meshlambert_vert,fragmentShader:we.meshlambert_frag},phong:{uniforms:xt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new Ye(0)},specular:{value:new Ye(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:we.meshphong_vert,fragmentShader:we.meshphong_frag},standard:{uniforms:xt([le.common,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.roughnessmap,le.metalnessmap,le.fog,le.lights,{emissive:{value:new Ye(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:we.meshphysical_vert,fragmentShader:we.meshphysical_frag},toon:{uniforms:xt([le.common,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.gradientmap,le.fog,le.lights,{emissive:{value:new Ye(0)}}]),vertexShader:we.meshtoon_vert,fragmentShader:we.meshtoon_frag},matcap:{uniforms:xt([le.common,le.bumpmap,le.normalmap,le.displacementmap,le.fog,{matcap:{value:null}}]),vertexShader:we.meshmatcap_vert,fragmentShader:we.meshmatcap_frag},points:{uniforms:xt([le.points,le.fog]),vertexShader:we.points_vert,fragmentShader:we.points_frag},dashed:{uniforms:xt([le.common,le.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:we.linedashed_vert,fragmentShader:we.linedashed_frag},depth:{uniforms:xt([le.common,le.displacementmap]),vertexShader:we.depth_vert,fragmentShader:we.depth_frag},normal:{uniforms:xt([le.common,le.bumpmap,le.normalmap,le.displacementmap,{opacity:{value:1}}]),vertexShader:we.meshnormal_vert,fragmentShader:we.meshnormal_frag},sprite:{uniforms:xt([le.sprite,le.fog]),vertexShader:we.sprite_vert,fragmentShader:we.sprite_frag},background:{uniforms:{uvTransform:{value:new ye},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:we.background_vert,fragmentShader:we.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new ye}},vertexShader:we.backgroundCube_vert,fragmentShader:we.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:we.cube_vert,fragmentShader:we.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:we.equirect_vert,fragmentShader:we.equirect_frag},distance:{uniforms:xt([le.common,le.displacementmap,{referencePosition:{value:new Ie},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:we.distance_vert,fragmentShader:we.distance_frag},shadow:{uniforms:xt([le.lights,le.fog,{color:{value:new Ye(0)},opacity:{value:1}}]),vertexShader:we.shadow_vert,fragmentShader:we.shadow_frag}};yt.physical={uniforms:xt([yt.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new ye},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new ye},clearcoatNormalScale:{value:new it(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new ye},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new ye},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new ye},sheen:{value:0},sheenColor:{value:new Ye(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new ye},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new ye},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new ye},transmissionSamplerSize:{value:new it},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new ye},attenuationDistance:{value:0},attenuationColor:{value:new Ye(0)},specularColor:{value:new Ye(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new ye},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new ye},anisotropyVector:{value:new it},anisotropyMap:{value:null},anisotropyMapTransform:{value:new ye}}]),vertexShader:we.meshphysical_vert,fragmentShader:we.meshphysical_frag};const Pn={r:0,b:0,g:0},lf=new tn,Ir=new ye;Ir.set(-1,0,0,0,1,0,0,0,1);function cf(e,n,t,i,a,o){const s=new Ye(0);let d=a===!0?0:1,M,g,F=null,C=0,h=null;function S(w){let I=w.isScene===!0?w.background:null;if(I&&I.isTexture){const m=w.backgroundBlurriness>0;I=n.get(I,m)}return I}function R(w){let I=!1;const m=S(w);m===null?u(s,d):m&&m.isColor&&(u(m,1),I=!0);const A=e.xr.getEnvironmentBlendMode();A==="additive"?t.buffers.color.setClear(0,0,0,1,o):A==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,o),(e.autoClear||I)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function B(w,I){const m=S(I);m&&(m.isCubeTexture||m.mapping===Hn)?(g===void 0&&(g=new Ht(new Ri(1,1,1),new Vt({name:"BackgroundCubeMaterial",uniforms:vi(yt.backgroundCube.uniforms),vertexShader:yt.backgroundCube.vertexShader,fragmentShader:yt.backgroundCube.fragmentShader,side:At,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),g.geometry.deleteAttribute("normal"),g.geometry.deleteAttribute("uv"),g.onBeforeRender=function(A,v,P){this.matrixWorld.copyPosition(P.matrixWorld)},Object.defineProperty(g.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(g)),g.material.uniforms.envMap.value=m,g.material.uniforms.backgroundBlurriness.value=I.backgroundBlurriness,g.material.uniforms.backgroundIntensity.value=I.backgroundIntensity,g.material.uniforms.backgroundRotation.value.setFromMatrix4(lf.makeRotationFromEuler(I.backgroundRotation)).transpose(),m.isCubeTexture&&m.isRenderTargetTexture===!1&&g.material.uniforms.backgroundRotation.value.premultiply(Ir),g.material.toneMapped=Je.getTransfer(m.colorSpace)!==Ze,(F!==m||C!==m.version||h!==e.toneMapping)&&(g.material.needsUpdate=!0,F=m,C=m.version,h=e.toneMapping),g.layers.enableAll(),w.unshift(g,g.geometry,g.material,0,0,null)):m&&m.isTexture&&(M===void 0&&(M=new Ht(new bi(2,2),new Vt({name:"BackgroundMaterial",uniforms:vi(yt.background.uniforms),vertexShader:yt.background.vertexShader,fragmentShader:yt.background.fragmentShader,side:En,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),M.geometry.deleteAttribute("normal"),Object.defineProperty(M.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(M)),M.material.uniforms.t2D.value=m,M.material.uniforms.backgroundIntensity.value=I.backgroundIntensity,M.material.toneMapped=Je.getTransfer(m.colorSpace)!==Ze,m.matrixAutoUpdate===!0&&m.updateMatrix(),M.material.uniforms.uvTransform.value.copy(m.matrix),(F!==m||C!==m.version||h!==e.toneMapping)&&(M.material.needsUpdate=!0,F=m,C=m.version,h=e.toneMapping),M.layers.enableAll(),w.unshift(M,M.geometry,M.material,0,0,null))}function u(w,I){w.getRGB(Pn,xr(e)),t.buffers.color.setClear(Pn.r,Pn.g,Pn.b,I,o)}function c(){g!==void 0&&(g.geometry.dispose(),g.material.dispose(),g=void 0),M!==void 0&&(M.geometry.dispose(),M.material.dispose(),M=void 0)}return{getClearColor:function(){return s},setClearColor:function(w,I=1){s.set(w),d=I,u(s,d)},getClearAlpha:function(){return d},setClearAlpha:function(w){d=w,u(s,d)},render:R,addToRenderList:B,dispose:c}}function ff(e,n){const t=e.getParameter(e.MAX_VERTEX_ATTRIBS),i={},a=h(null);let o=a,s=!1;function d(D,O,j,K,z){let q=!1;const V=C(D,K,j,O);o!==V&&(o=V,g(o.object)),q=S(D,K,j,z),q&&R(D,K,j,z),z!==null&&n.update(z,e.ELEMENT_ARRAY_BUFFER),(q||s)&&(s=!1,m(D,O,j,K),z!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,n.get(z).buffer))}function M(){return e.createVertexArray()}function g(D){return e.bindVertexArray(D)}function F(D){return e.deleteVertexArray(D)}function C(D,O,j,K){const z=K.wireframe===!0;let q=i[O.id];q===void 0&&(q={},i[O.id]=q);const V=D.isInstancedMesh===!0?D.id:0;let Z=q[V];Z===void 0&&(Z={},q[V]=Z);let ee=Z[j.id];ee===void 0&&(ee={},Z[j.id]=ee);let ce=ee[z];return ce===void 0&&(ce=h(M()),ee[z]=ce),ce}function h(D){const O=[],j=[],K=[];for(let z=0;z<t;z++)O[z]=0,j[z]=0,K[z]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:O,enabledAttributes:j,attributeDivisors:K,object:D,attributes:{},index:null}}function S(D,O,j,K){const z=o.attributes,q=O.attributes;let V=0;const Z=j.getAttributes();for(const ee in Z)if(Z[ee].location>=0){const _e=z[ee];let ve=q[ee];if(ve===void 0&&(ee==="instanceMatrix"&&D.instanceMatrix&&(ve=D.instanceMatrix),ee==="instanceColor"&&D.instanceColor&&(ve=D.instanceColor)),_e===void 0||_e.attribute!==ve||ve&&_e.data!==ve.data)return!0;V++}return o.attributesNum!==V||o.index!==K}function R(D,O,j,K){const z={},q=O.attributes;let V=0;const Z=j.getAttributes();for(const ee in Z)if(Z[ee].location>=0){let _e=q[ee];_e===void 0&&(ee==="instanceMatrix"&&D.instanceMatrix&&(_e=D.instanceMatrix),ee==="instanceColor"&&D.instanceColor&&(_e=D.instanceColor));const ve={};ve.attribute=_e,_e&&_e.data&&(ve.data=_e.data),z[ee]=ve,V++}o.attributes=z,o.attributesNum=V,o.index=K}function B(){const D=o.newAttributes;for(let O=0,j=D.length;O<j;O++)D[O]=0}function u(D){c(D,0)}function c(D,O){const j=o.newAttributes,K=o.enabledAttributes,z=o.attributeDivisors;j[D]=1,K[D]===0&&(e.enableVertexAttribArray(D),K[D]=1),z[D]!==O&&(e.vertexAttribDivisor(D,O),z[D]=O)}function w(){const D=o.newAttributes,O=o.enabledAttributes;for(let j=0,K=O.length;j<K;j++)O[j]!==D[j]&&(e.disableVertexAttribArray(j),O[j]=0)}function I(D,O,j,K,z,q,V){V===!0?e.vertexAttribIPointer(D,O,j,z,q):e.vertexAttribPointer(D,O,j,K,z,q)}function m(D,O,j,K){B();const z=K.attributes,q=j.getAttributes(),V=O.defaultAttributeValues;for(const Z in q){const ee=q[Z];if(ee.location>=0){let ce=z[Z];if(ce===void 0&&(Z==="instanceMatrix"&&D.instanceMatrix&&(ce=D.instanceMatrix),Z==="instanceColor"&&D.instanceColor&&(ce=D.instanceColor)),ce!==void 0){const _e=ce.normalized,ve=ce.itemSize,Oe=n.get(ce);if(Oe===void 0)continue;const Qe=Oe.buffer,Be=Oe.type,k=Oe.bytesPerElement,ne=Be===e.INT||Be===e.UNSIGNED_INT||ce.gpuType===Sr;if(ce.isInterleavedBufferAttribute){const Q=ce.data,Re=Q.stride,Ce=ce.offset;if(Q.isInstancedInterleavedBuffer){for(let Ae=0;Ae<ee.locationSize;Ae++)c(ee.location+Ae,Q.meshPerAttribute);D.isInstancedMesh!==!0&&K._maxInstanceCount===void 0&&(K._maxInstanceCount=Q.meshPerAttribute*Q.count)}else for(let Ae=0;Ae<ee.locationSize;Ae++)u(ee.location+Ae);e.bindBuffer(e.ARRAY_BUFFER,Qe);for(let Ae=0;Ae<ee.locationSize;Ae++)I(ee.location+Ae,ve/ee.locationSize,Be,_e,Re*k,(Ce+ve/ee.locationSize*Ae)*k,ne)}else{if(ce.isInstancedBufferAttribute){for(let Q=0;Q<ee.locationSize;Q++)c(ee.location+Q,ce.meshPerAttribute);D.isInstancedMesh!==!0&&K._maxInstanceCount===void 0&&(K._maxInstanceCount=ce.meshPerAttribute*ce.count)}else for(let Q=0;Q<ee.locationSize;Q++)u(ee.location+Q);e.bindBuffer(e.ARRAY_BUFFER,Qe);for(let Q=0;Q<ee.locationSize;Q++)I(ee.location+Q,ve/ee.locationSize,Be,_e,ve*k,ve/ee.locationSize*Q*k,ne)}}else if(V!==void 0){const _e=V[Z];if(_e!==void 0)switch(_e.length){case 2:e.vertexAttrib2fv(ee.location,_e);break;case 3:e.vertexAttrib3fv(ee.location,_e);break;case 4:e.vertexAttrib4fv(ee.location,_e);break;default:e.vertexAttrib1fv(ee.location,_e)}}}}w()}function A(){_();for(const D in i){const O=i[D];for(const j in O){const K=O[j];for(const z in K){const q=K[z];for(const V in q)F(q[V].object),delete q[V];delete K[z]}}delete i[D]}}function v(D){if(i[D.id]===void 0)return;const O=i[D.id];for(const j in O){const K=O[j];for(const z in K){const q=K[z];for(const V in q)F(q[V].object),delete q[V];delete K[z]}}delete i[D.id]}function P(D){for(const O in i){const j=i[O];for(const K in j){const z=j[K];if(z[D.id]===void 0)continue;const q=z[D.id];for(const V in q)F(q[V].object),delete q[V];delete z[D.id]}}}function f(D){for(const O in i){const j=i[O],K=D.isInstancedMesh===!0?D.id:0,z=j[K];if(z!==void 0){for(const q in z){const V=z[q];for(const Z in V)F(V[Z].object),delete V[Z];delete z[q]}delete j[K],Object.keys(j).length===0&&delete i[O]}}}function _(){y(),s=!0,o!==a&&(o=a,g(o.object))}function y(){a.geometry=null,a.program=null,a.wireframe=!1}return{setup:d,reset:_,resetDefaultState:y,dispose:A,releaseStatesOfGeometry:v,releaseStatesOfObject:f,releaseStatesOfProgram:P,initAttributes:B,enableAttribute:u,disableUnusedAttributes:w}}function uf(e,n,t){let i;function a(M){i=M}function o(M,g){e.drawArrays(i,M,g),t.update(g,i,1)}function s(M,g,F){F!==0&&(e.drawArraysInstanced(i,M,g,F),t.update(g,i,F))}function d(M,g,F){if(F===0)return;n.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,M,0,g,0,F);let h=0;for(let S=0;S<F;S++)h+=g[S];t.update(h,i,1)}this.setMode=a,this.render=o,this.renderInstances=s,this.renderMultiDraw=d}function df(e,n,t,i){let a;function o(){if(a!==void 0)return a;if(n.has("EXT_texture_filter_anisotropic")===!0){const P=n.get("EXT_texture_filter_anisotropic");a=e.getParameter(P.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else a=0;return a}function s(P){return!(P!==Gt&&i.convert(P)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))}function d(P){const f=P===Bt&&(n.has("EXT_color_buffer_half_float")||n.has("EXT_color_buffer_float"));return!(P!==Rt&&i.convert(P)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE)&&P!==Kt&&!f)}function M(P){if(P==="highp"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return"highp";P="mediump"}return P==="mediump"&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let g=t.precision!==void 0?t.precision:"highp";const F=M(g);F!==g&&(Ve("WebGLRenderer:",g,"not supported, using",F,"instead."),g=F);const C=t.logarithmicDepthBuffer===!0,h=t.reversedDepthBuffer===!0&&n.has("EXT_clip_control");t.reversedDepthBuffer===!0&&h===!1&&Ve("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const S=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),R=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),B=e.getParameter(e.MAX_TEXTURE_SIZE),u=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),c=e.getParameter(e.MAX_VERTEX_ATTRIBS),w=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),I=e.getParameter(e.MAX_VARYING_VECTORS),m=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),A=e.getParameter(e.MAX_SAMPLES),v=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:o,getMaxPrecision:M,textureFormatReadable:s,textureTypeReadable:d,precision:g,logarithmicDepthBuffer:C,reversedDepthBuffer:h,maxTextures:S,maxVertexTextures:R,maxTextureSize:B,maxCubemapSize:u,maxAttributes:c,maxVertexUniforms:w,maxVaryings:I,maxFragmentUniforms:m,maxSamples:A,samples:v}}function pf(e){const n=this;let t=null,i=0,a=!1,o=!1;const s=new Io,d=new ye,M={value:null,needsUpdate:!1};this.uniform=M,this.numPlanes=0,this.numIntersection=0,this.init=function(C,h){const S=C.length!==0||h||i!==0||a;return a=h,i=C.length,S},this.beginShadows=function(){o=!0,F(null)},this.endShadows=function(){o=!1},this.setGlobalState=function(C,h){t=F(C,h,0)},this.setState=function(C,h,S){const R=C.clippingPlanes,B=C.clipIntersection,u=C.clipShadows,c=e.get(C);if(!a||R===null||R.length===0||o&&!u)o?F(null):g();else{const w=o?0:i,I=w*4;let m=c.clippingState||null;M.value=m,m=F(R,h,I,S);for(let A=0;A!==I;++A)m[A]=t[A];c.clippingState=m,this.numIntersection=B?this.numPlanes:0,this.numPlanes+=w}};function g(){M.value!==t&&(M.value=t,M.needsUpdate=i>0),n.numPlanes=i,n.numIntersection=0}function F(C,h,S,R){const B=C!==null?C.length:0;let u=null;if(B!==0){if(u=M.value,R!==!0||u===null){const c=S+B*4,w=h.matrixWorldInverse;d.getNormalMatrix(w),(u===null||u.length<c)&&(u=new Float32Array(c));for(let I=0,m=S;I!==B;++I,m+=4)s.copy(C[I]).applyMatrix4(w,d),s.normal.toArray(u,m),u[m+3]=s.constant}M.value=u,M.needsUpdate=!0}return n.numPlanes=B,n.numIntersection=0,u}}const $t=4,Ma=[.125,.215,.35,.446,.526,.582],Qt=20,hf=256,mn=new Mi,Ta=new Ye;let ti=null,ni=0,ii=0,ai=!1;const mf=new Ie;class Aa{constructor(n){this._renderer=n,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(n,t=0,i=.1,a=100,o={}){const{size:s=256,position:d=mf}=o;ti=this._renderer.getRenderTarget(),ni=this._renderer.getActiveCubeFace(),ii=this._renderer.getActiveMipmapLevel(),ai=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(s);const M=this._allocateTargets();return M.depthBuffer=!0,this._sceneToCubeUV(n,i,a,M,d),t>0&&this._blur(M,0,0,t),this._applyPMREM(M),this._cleanup(M),M}fromEquirectangular(n,t=null){return this._fromTexture(n,t)}fromCubemap(n,t=null){return this._fromTexture(n,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Ca(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ra(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(n){this._lodMax=Math.floor(Math.log2(n)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let n=0;n<this._lodMeshes.length;n++)this._lodMeshes[n].geometry.dispose()}_cleanup(n){this._renderer.setRenderTarget(ti,ni,ii),this._renderer.xr.enabled=ai,n.scissorTest=!1,sn(n,0,0,n.width,n.height)}_fromTexture(n,t){n.mapping===An||n.mapping===dn?this._setSize(n.image.length===0?16:n.image[0].width||n.image[0].image.width):this._setSize(n.image.width/4),ti=this._renderer.getRenderTarget(),ni=this._renderer.getActiveCubeFace(),ii=this._renderer.getActiveMipmapLevel(),ai=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=t||this._allocateTargets();return this._textureToCubeUV(n,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const n=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:_t,minFilter:_t,generateMipmaps:!1,type:Bt,format:Gt,colorSpace:Lr,depthBuffer:!1},a=ba(n,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==n||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=ba(n,t,i);const{_lodMax:o}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=_f(o)),this._blurMaterial=vf(o,n,t),this._ggxMaterial=gf(o,n,t)}return a}_compileMaterial(n){const t=new Ht(new bn,n);this._renderer.compile(t,mn)}_sceneToCubeUV(n,t,i,a,o){const M=new In(90,1,t,i),g=[1,-1,1,1,1,1],F=[1,1,1,-1,-1,-1],C=this._renderer,h=C.autoClear,S=C.toneMapping;C.getClearColor(Ta),C.toneMapping=Ot,C.autoClear=!1,C.state.buffers.depth.getReversed()&&(C.setRenderTarget(a),C.clearDepth(),C.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Ht(new Ri,new Oo({name:"PMREM.Background",side:At,depthWrite:!1,depthTest:!1})));const B=this._backgroundBox,u=B.material;let c=!1;const w=n.background;w?w.isColor&&(u.color.copy(w),n.background=null,c=!0):(u.color.copy(Ta),c=!0);for(let I=0;I<6;I++){const m=I%3;m===0?(M.up.set(0,g[I],0),M.position.set(o.x,o.y,o.z),M.lookAt(o.x+F[I],o.y,o.z)):m===1?(M.up.set(0,0,g[I]),M.position.set(o.x,o.y,o.z),M.lookAt(o.x,o.y+F[I],o.z)):(M.up.set(0,g[I],0),M.position.set(o.x,o.y,o.z),M.lookAt(o.x,o.y,o.z+F[I]));const A=this._cubeSize;sn(a,m*A,I>2?A:0,A,A),C.setRenderTarget(a),c&&C.render(B,M),C.render(n,M)}C.toneMapping=S,C.autoClear=h,n.background=w}_textureToCubeUV(n,t){const i=this._renderer,a=n.mapping===An||n.mapping===dn;a?(this._cubemapMaterial===null&&(this._cubemapMaterial=Ca()),this._cubemapMaterial.uniforms.flipEnvMap.value=n.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ra());const o=a?this._cubemapMaterial:this._equirectMaterial,s=this._lodMeshes[0];s.material=o;const d=o.uniforms;d.envMap.value=n;const M=this._cubeSize;sn(t,0,0,3*M,2*M),i.setRenderTarget(t),i.render(s,mn)}_applyPMREM(n){const t=this._renderer,i=t.autoClear;t.autoClear=!1;const a=this._lodMeshes.length;for(let o=1;o<a;o++)this._applyGGXFilter(n,o-1,o);t.autoClear=i}_applyGGXFilter(n,t,i){const a=this._renderer,o=this._pingPongRenderTarget,s=this._ggxMaterial,d=this._lodMeshes[i];d.material=s;const M=s.uniforms,g=i/(this._lodMeshes.length-1),F=t/(this._lodMeshes.length-1),C=Math.sqrt(g*g-F*F),h=0+g*1.25,S=C*h,{_lodMax:R}=this,B=this._sizeLods[i],u=3*B*(i>R-$t?i-R+$t:0),c=4*(this._cubeSize-B);M.envMap.value=n.texture,M.roughness.value=S,M.mipInt.value=R-t,sn(o,u,c,3*B,2*B),a.setRenderTarget(o),a.render(d,mn),M.envMap.value=o.texture,M.roughness.value=0,M.mipInt.value=R-i,sn(n,u,c,3*B,2*B),a.setRenderTarget(n),a.render(d,mn)}_blur(n,t,i,a,o){const s=this._pingPongRenderTarget;this._halfBlur(n,s,t,i,a,"latitudinal",o),this._halfBlur(s,n,i,i,a,"longitudinal",o)}_halfBlur(n,t,i,a,o,s,d){const M=this._renderer,g=this._blurMaterial;s!=="latitudinal"&&s!=="longitudinal"&&je("blur direction must be either latitudinal or longitudinal!");const F=3,C=this._lodMeshes[a];C.material=g;const h=g.uniforms,S=this._sizeLods[i]-1,R=isFinite(o)?Math.PI/(2*S):2*Math.PI/(2*Qt-1),B=o/R,u=isFinite(o)?1+Math.floor(F*B):Qt;u>Qt&&Ve(`sigmaRadians, ${o}, is too large and will clip, as it requested ${u} samples when the maximum is set to ${Qt}`);const c=[];let w=0;for(let P=0;P<Qt;++P){const f=P/B,_=Math.exp(-f*f/2);c.push(_),P===0?w+=_:P<u&&(w+=2*_)}for(let P=0;P<c.length;P++)c[P]=c[P]/w;h.envMap.value=n.texture,h.samples.value=u,h.weights.value=c,h.latitudinal.value=s==="latitudinal",d&&(h.poleAxis.value=d);const{_lodMax:I}=this;h.dTheta.value=R,h.mipInt.value=I-i;const m=this._sizeLods[a],A=3*m*(a>I-$t?a-I+$t:0),v=4*(this._cubeSize-m);sn(t,A,v,3*m,2*m),M.setRenderTarget(t),M.render(C,mn)}}function _f(e){const n=[],t=[],i=[];let a=e;const o=e-$t+1+Ma.length;for(let s=0;s<o;s++){const d=Math.pow(2,a);n.push(d);let M=1/d;s>e-$t?M=Ma[s-e+$t-1]:s===0&&(M=0),t.push(M);const g=1/(d-2),F=-g,C=1+g,h=[F,F,C,F,C,C,F,F,C,C,F,C],S=6,R=6,B=3,u=2,c=1,w=new Float32Array(B*R*S),I=new Float32Array(u*R*S),m=new Float32Array(c*R*S);for(let v=0;v<S;v++){const P=v%3*2/3-1,f=v>2?0:-1,_=[P,f,0,P+2/3,f,0,P+2/3,f+1,0,P,f,0,P+2/3,f+1,0,P,f+1,0];w.set(_,B*R*v),I.set(h,u*R*v);const y=[v,v,v,v,v,v];m.set(y,c*R*v)}const A=new bn;A.setAttribute("position",new Nn(w,B)),A.setAttribute("uv",new Nn(I,u)),A.setAttribute("faceIndex",new Nn(m,c)),i.push(new Ht(A,null)),a>$t&&a--}return{lodMeshes:i,sizeLods:n,sigmas:t}}function ba(e,n,t){const i=new Pt(e,n,t);return i.texture.mapping=Hn,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function sn(e,n,t,i,a){e.viewport.set(n,t,i,a),e.scissor.set(n,t,i,a)}function gf(e,n,t){return new Vt({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:hf,CUBEUV_TEXEL_WIDTH:1/n,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Wn(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:Wt,depthTest:!1,depthWrite:!1})}function vf(e,n,t){const i=new Float32Array(Qt),a=new Ie(0,1,0);return new Vt({name:"SphericalGaussianBlur",defines:{n:Qt,CUBEUV_TEXEL_WIDTH:1/n,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:a}},vertexShader:Wn(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Wt,depthTest:!1,depthWrite:!1})}function Ra(){return new Vt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Wn(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Wt,depthTest:!1,depthWrite:!1})}function Ca(){return new Vt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Wn(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Wt,depthTest:!1,depthWrite:!1})}function Wn(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}class Nr extends Pt{constructor(n=1,t={}){super(n,n,t),this.isWebGLCubeRenderTarget=!0;const i={width:n,height:n,depth:1},a=[i,i,i,i,i,i];this.texture=new Mr(a),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(n,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},a=new Ri(5,5,5),o=new Vt({name:"CubemapFromEquirect",uniforms:vi(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:At,blending:Wt});o.uniforms.tEquirect.value=t;const s=new Ht(a,o),d=t.minFilter;return t.minFilter===ln&&(t.minFilter=_t),new as(1,10,this).update(n,s),t.minFilter=d,s.geometry.dispose(),s.material.dispose(),this}clear(n,t=!0,i=!0,a=!0){const o=n.getRenderTarget();for(let s=0;s<6;s++)n.setRenderTarget(this,s),n.clear(t,i,a);n.setRenderTarget(o)}}function Sf(e){let n=new WeakMap,t=new WeakMap,i=null;function a(h,S=!1){return h==null?null:S?s(h):o(h)}function o(h){if(h&&h.isTexture){const S=h.mapping;if(S===Qn||S===Jn)if(n.has(h)){const R=n.get(h).texture;return d(R,h.mapping)}else{const R=h.image;if(R&&R.height>0){const B=new Nr(R.height);return B.fromEquirectangularTexture(e,h),n.set(h,B),h.addEventListener("dispose",g),d(B.texture,h.mapping)}else return null}}return h}function s(h){if(h&&h.isTexture){const S=h.mapping,R=S===Qn||S===Jn,B=S===An||S===dn;if(R||B){let u=t.get(h);const c=u!==void 0?u.texture.pmremVersion:0;if(h.isRenderTargetTexture&&h.pmremVersion!==c)return i===null&&(i=new Aa(e)),u=R?i.fromEquirectangular(h,u):i.fromCubemap(h,u),u.texture.pmremVersion=h.pmremVersion,t.set(h,u),u.texture;if(u!==void 0)return u.texture;{const w=h.image;return R&&w&&w.height>0||B&&w&&M(w)?(i===null&&(i=new Aa(e)),u=R?i.fromEquirectangular(h):i.fromCubemap(h),u.texture.pmremVersion=h.pmremVersion,t.set(h,u),h.addEventListener("dispose",F),u.texture):null}}}return h}function d(h,S){return S===Qn?h.mapping=An:S===Jn&&(h.mapping=dn),h}function M(h){let S=0;const R=6;for(let B=0;B<R;B++)h[B]!==void 0&&S++;return S===R}function g(h){const S=h.target;S.removeEventListener("dispose",g);const R=n.get(S);R!==void 0&&(n.delete(S),R.dispose())}function F(h){const S=h.target;S.removeEventListener("dispose",F);const R=t.get(S);R!==void 0&&(t.delete(S),R.dispose())}function C(){n=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:a,dispose:C}}function Ef(e){const n={};function t(i){if(n[i]!==void 0)return n[i];const a=e.getExtension(i);return n[i]=a,a}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){const a=t(i);return a===null&&oo("WebGLRenderer: "+i+" extension not supported."),a}}}function xf(e,n,t,i){const a={},o=new WeakMap;function s(C){const h=C.target;h.index!==null&&n.remove(h.index);for(const R in h.attributes)n.remove(h.attributes[R]);h.removeEventListener("dispose",s),delete a[h.id];const S=o.get(h);S&&(n.remove(S),o.delete(h)),i.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,t.memory.geometries--}function d(C,h){return a[h.id]===!0||(h.addEventListener("dispose",s),a[h.id]=!0,t.memory.geometries++),h}function M(C){const h=C.attributes;for(const S in h)n.update(h[S],e.ARRAY_BUFFER)}function g(C){const h=[],S=C.index,R=C.attributes.position;let B=0;if(R===void 0)return;if(S!==null){const w=S.array;B=S.version;for(let I=0,m=w.length;I<m;I+=3){const A=w[I+0],v=w[I+1],P=w[I+2];h.push(A,v,v,P,P,A)}}else{const w=R.array;B=R.version;for(let I=0,m=w.length/3-1;I<m;I+=3){const A=I+0,v=I+1,P=I+2;h.push(A,v,v,P,P,A)}}const u=new(R.count>=65535?rs:os)(h,1);u.version=B;const c=o.get(C);c&&n.remove(c),o.set(C,u)}function F(C){const h=o.get(C);if(h){const S=C.index;S!==null&&h.version<S.version&&g(C)}else g(C);return o.get(C)}return{get:d,update:M,getWireframeAttribute:F}}function Mf(e,n,t){let i;function a(C){i=C}let o,s;function d(C){o=C.type,s=C.bytesPerElement}function M(C,h){e.drawElements(i,h,o,C*s),t.update(h,i,1)}function g(C,h,S){S!==0&&(e.drawElementsInstanced(i,h,o,C*s,S),t.update(h,i,S))}function F(C,h,S){if(S===0)return;n.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,h,0,o,C,0,S);let B=0;for(let u=0;u<S;u++)B+=h[u];t.update(B,i,1)}this.setMode=a,this.setIndex=d,this.render=M,this.renderInstances=g,this.renderMultiDraw=F}function Tf(e){const n={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(o,s,d){switch(t.calls++,s){case e.TRIANGLES:t.triangles+=d*(o/3);break;case e.LINES:t.lines+=d*(o/2);break;case e.LINE_STRIP:t.lines+=d*(o-1);break;case e.LINE_LOOP:t.lines+=d*o;break;case e.POINTS:t.points+=d*o;break;default:je("WebGLInfo: Unknown draw mode:",s);break}}function a(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:n,render:t,programs:null,autoReset:!0,reset:a,update:i}}function Af(e,n,t){const i=new WeakMap,a=new pt;function o(s,d,M){const g=s.morphTargetInfluences,F=d.morphAttributes.position||d.morphAttributes.normal||d.morphAttributes.color,C=F!==void 0?F.length:0;let h=i.get(d);if(h===void 0||h.count!==C){let _=function(){P.dispose(),i.delete(d),d.removeEventListener("dispose",_)};h!==void 0&&h.texture.dispose();const S=d.morphAttributes.position!==void 0,R=d.morphAttributes.normal!==void 0,B=d.morphAttributes.color!==void 0,u=d.morphAttributes.position||[],c=d.morphAttributes.normal||[],w=d.morphAttributes.color||[];let I=0;S===!0&&(I=1),R===!0&&(I=2),B===!0&&(I=3);let m=d.attributes.position.count*I,A=1;m>n.maxTextureSize&&(A=Math.ceil(m/n.maxTextureSize),m=n.maxTextureSize);const v=new Float32Array(m*A*4*C),P=new Er(v,m,A,C);P.type=Kt,P.needsUpdate=!0;const f=I*4;for(let y=0;y<C;y++){const D=u[y],O=c[y],j=w[y],K=m*A*4*y;for(let z=0;z<D.count;z++){const q=z*f;S===!0&&(a.fromBufferAttribute(D,z),v[K+q+0]=a.x,v[K+q+1]=a.y,v[K+q+2]=a.z,v[K+q+3]=0),R===!0&&(a.fromBufferAttribute(O,z),v[K+q+4]=a.x,v[K+q+5]=a.y,v[K+q+6]=a.z,v[K+q+7]=0),B===!0&&(a.fromBufferAttribute(j,z),v[K+q+8]=a.x,v[K+q+9]=a.y,v[K+q+10]=a.z,v[K+q+11]=j.itemSize===4?a.w:1)}}h={count:C,texture:P,size:new it(m,A)},i.set(d,h),d.addEventListener("dispose",_)}if(s.isInstancedMesh===!0&&s.morphTexture!==null)M.getUniforms().setValue(e,"morphTexture",s.morphTexture,t);else{let S=0;for(let B=0;B<g.length;B++)S+=g[B];const R=d.morphTargetsRelative?1:1-S;M.getUniforms().setValue(e,"morphTargetBaseInfluence",R),M.getUniforms().setValue(e,"morphTargetInfluences",g)}M.getUniforms().setValue(e,"morphTargetsTexture",h.texture,t),M.getUniforms().setValue(e,"morphTargetsTextureSize",h.size)}return{update:o}}function bf(e,n,t,i,a){let o=new WeakMap;function s(g){const F=a.render.frame,C=g.geometry,h=n.get(g,C);if(o.get(h)!==F&&(n.update(h),o.set(h,F)),g.isInstancedMesh&&(g.hasEventListener("dispose",M)===!1&&g.addEventListener("dispose",M),o.get(g)!==F&&(t.update(g.instanceMatrix,e.ARRAY_BUFFER),g.instanceColor!==null&&t.update(g.instanceColor,e.ARRAY_BUFFER),o.set(g,F))),g.isSkinnedMesh){const S=g.skeleton;o.get(S)!==F&&(S.update(),o.set(S,F))}return h}function d(){o=new WeakMap}function M(g){const F=g.target;F.removeEventListener("dispose",M),i.releaseStatesOfObject(F),t.remove(F.instanceMatrix),F.instanceColor!==null&&t.remove(F.instanceColor)}return{update:s,dispose:d}}const Rf={[Pr]:"LINEAR_TONE_MAPPING",[Dr]:"REINHARD_TONE_MAPPING",[Cr]:"CINEON_TONE_MAPPING",[Rr]:"ACES_FILMIC_TONE_MAPPING",[br]:"AGX_TONE_MAPPING",[Ar]:"NEUTRAL_TONE_MAPPING",[Tr]:"CUSTOM_TONE_MAPPING"};function Cf(e,n,t,i,a,o){const s=new Pt(n,t,{type:e,depthBuffer:a,stencilBuffer:o,samples:i?4:0,depthTexture:a?new xn(n,t):void 0}),d=new Pt(n,t,{type:Bt,depthBuffer:!1,stencilBuffer:!1}),M=new bn;M.setAttribute("position",new jt([-1,3,0,-1,-1,0,3,-1,0],3)),M.setAttribute("uv",new jt([0,2,0,0,2,0],2));const g=new no({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),F=new Ht(M,g),C=new Mi(-1,1,1,-1,0,1);let h=null,S=null,R=!1,B,u=null,c=[],w=!1;this.setSize=function(I,m){s.setSize(I,m),d.setSize(I,m);for(let A=0;A<c.length;A++){const v=c[A];v.setSize&&v.setSize(I,m)}},this.setEffects=function(I){c=I,w=c.length>0&&c[0].isRenderPass===!0;const m=s.width,A=s.height;for(let v=0;v<c.length;v++){const P=c[v];P.setSize&&P.setSize(m,A)}},this.begin=function(I,m){if(R||I.toneMapping===Ot&&c.length===0)return!1;if(u=m,m!==null){const A=m.width,v=m.height;(s.width!==A||s.height!==v)&&this.setSize(A,v)}return w===!1&&I.setRenderTarget(s),B=I.toneMapping,I.toneMapping=Ot,!0},this.hasRenderPass=function(){return w},this.end=function(I,m){I.toneMapping=B,R=!0;let A=s,v=d;for(let P=0;P<c.length;P++){const f=c[P];if(f.enabled!==!1&&(f.render(I,v,A,m),f.needsSwap!==!1)){const _=A;A=v,v=_}}if(h!==I.outputColorSpace||S!==I.toneMapping){h=I.outputColorSpace,S=I.toneMapping,g.defines={},Je.getTransfer(h)===Ze&&(g.defines.SRGB_TRANSFER="");const P=Rf[S];P&&(g.defines[P]=""),g.needsUpdate=!0}g.uniforms.tDiffuse.value=A.texture,I.setRenderTarget(u),I.render(F,C),u=null,R=!1},this.isCompositing=function(){return R},this.dispose=function(){s.depthTexture&&s.depthTexture.dispose(),s.dispose(),d.dispose(),M.dispose(),g.dispose()}}const yr=new ps,Si=new xn(1,1),Fr=new Er,Gr=new ls,Or=new Mr,Da=[],Pa=[],La=new Float32Array(16),wa=new Float32Array(9),Ua=new Float32Array(4);function pn(e,n,t){const i=e[0];if(i<=0||i>0)return e;const a=n*t;let o=Da[a];if(o===void 0&&(o=new Float32Array(a),Da[a]=o),n!==0){i.toArray(o,0);for(let s=1,d=0;s!==n;++s)d+=t,e[s].toArray(o,d)}return o}function ft(e,n){if(e.length!==n.length)return!1;for(let t=0,i=e.length;t<i;t++)if(e[t]!==n[t])return!1;return!0}function ut(e,n){for(let t=0,i=n.length;t<i;t++)e[t]=n[t]}function zn(e,n){let t=Pa[n];t===void 0&&(t=new Int32Array(n),Pa[n]=t);for(let i=0;i!==n;++i)t[i]=e.allocateTextureUnit();return t}function Df(e,n){const t=this.cache;t[0]!==n&&(e.uniform1f(this.addr,n),t[0]=n)}function Pf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y)&&(e.uniform2f(this.addr,n.x,n.y),t[0]=n.x,t[1]=n.y);else{if(ft(t,n))return;e.uniform2fv(this.addr,n),ut(t,n)}}function Lf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z)&&(e.uniform3f(this.addr,n.x,n.y,n.z),t[0]=n.x,t[1]=n.y,t[2]=n.z);else if(n.r!==void 0)(t[0]!==n.r||t[1]!==n.g||t[2]!==n.b)&&(e.uniform3f(this.addr,n.r,n.g,n.b),t[0]=n.r,t[1]=n.g,t[2]=n.b);else{if(ft(t,n))return;e.uniform3fv(this.addr,n),ut(t,n)}}function wf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z||t[3]!==n.w)&&(e.uniform4f(this.addr,n.x,n.y,n.z,n.w),t[0]=n.x,t[1]=n.y,t[2]=n.z,t[3]=n.w);else{if(ft(t,n))return;e.uniform4fv(this.addr,n),ut(t,n)}}function Uf(e,n){const t=this.cache,i=n.elements;if(i===void 0){if(ft(t,n))return;e.uniformMatrix2fv(this.addr,!1,n),ut(t,n)}else{if(ft(t,i))return;Ua.set(i),e.uniformMatrix2fv(this.addr,!1,Ua),ut(t,i)}}function If(e,n){const t=this.cache,i=n.elements;if(i===void 0){if(ft(t,n))return;e.uniformMatrix3fv(this.addr,!1,n),ut(t,n)}else{if(ft(t,i))return;wa.set(i),e.uniformMatrix3fv(this.addr,!1,wa),ut(t,i)}}function Nf(e,n){const t=this.cache,i=n.elements;if(i===void 0){if(ft(t,n))return;e.uniformMatrix4fv(this.addr,!1,n),ut(t,n)}else{if(ft(t,i))return;La.set(i),e.uniformMatrix4fv(this.addr,!1,La),ut(t,i)}}function yf(e,n){const t=this.cache;t[0]!==n&&(e.uniform1i(this.addr,n),t[0]=n)}function Ff(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y)&&(e.uniform2i(this.addr,n.x,n.y),t[0]=n.x,t[1]=n.y);else{if(ft(t,n))return;e.uniform2iv(this.addr,n),ut(t,n)}}function Gf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z)&&(e.uniform3i(this.addr,n.x,n.y,n.z),t[0]=n.x,t[1]=n.y,t[2]=n.z);else{if(ft(t,n))return;e.uniform3iv(this.addr,n),ut(t,n)}}function Of(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z||t[3]!==n.w)&&(e.uniform4i(this.addr,n.x,n.y,n.z,n.w),t[0]=n.x,t[1]=n.y,t[2]=n.z,t[3]=n.w);else{if(ft(t,n))return;e.uniform4iv(this.addr,n),ut(t,n)}}function Bf(e,n){const t=this.cache;t[0]!==n&&(e.uniform1ui(this.addr,n),t[0]=n)}function Hf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y)&&(e.uniform2ui(this.addr,n.x,n.y),t[0]=n.x,t[1]=n.y);else{if(ft(t,n))return;e.uniform2uiv(this.addr,n),ut(t,n)}}function Vf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z)&&(e.uniform3ui(this.addr,n.x,n.y,n.z),t[0]=n.x,t[1]=n.y,t[2]=n.z);else{if(ft(t,n))return;e.uniform3uiv(this.addr,n),ut(t,n)}}function Wf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z||t[3]!==n.w)&&(e.uniform4ui(this.addr,n.x,n.y,n.z,n.w),t[0]=n.x,t[1]=n.y,t[2]=n.z,t[3]=n.w);else{if(ft(t,n))return;e.uniform4uiv(this.addr,n),ut(t,n)}}function zf(e,n,t){const i=this.cache,a=t.allocateTextureUnit();i[0]!==a&&(e.uniform1i(this.addr,a),i[0]=a);let o;this.type===e.SAMPLER_2D_SHADOW?(Si.compareFunction=t.isReversedDepthBuffer()?Ti:Ai,o=Si):o=yr,t.setTexture2D(n||o,a)}function kf(e,n,t){const i=this.cache,a=t.allocateTextureUnit();i[0]!==a&&(e.uniform1i(this.addr,a),i[0]=a),t.setTexture3D(n||Gr,a)}function Xf(e,n,t){const i=this.cache,a=t.allocateTextureUnit();i[0]!==a&&(e.uniform1i(this.addr,a),i[0]=a),t.setTextureCube(n||Or,a)}function qf(e,n,t){const i=this.cache,a=t.allocateTextureUnit();i[0]!==a&&(e.uniform1i(this.addr,a),i[0]=a),t.setTexture2DArray(n||Fr,a)}function Yf(e){switch(e){case 5126:return Df;case 35664:return Pf;case 35665:return Lf;case 35666:return wf;case 35674:return Uf;case 35675:return If;case 35676:return Nf;case 5124:case 35670:return yf;case 35667:case 35671:return Ff;case 35668:case 35672:return Gf;case 35669:case 35673:return Of;case 5125:return Bf;case 36294:return Hf;case 36295:return Vf;case 36296:return Wf;case 35678:case 36198:case 36298:case 36306:case 35682:return zf;case 35679:case 36299:case 36307:return kf;case 35680:case 36300:case 36308:case 36293:return Xf;case 36289:case 36303:case 36311:case 36292:return qf}}function Kf(e,n){e.uniform1fv(this.addr,n)}function $f(e,n){const t=pn(n,this.size,2);e.uniform2fv(this.addr,t)}function Zf(e,n){const t=pn(n,this.size,3);e.uniform3fv(this.addr,t)}function jf(e,n){const t=pn(n,this.size,4);e.uniform4fv(this.addr,t)}function Qf(e,n){const t=pn(n,this.size,4);e.uniformMatrix2fv(this.addr,!1,t)}function Jf(e,n){const t=pn(n,this.size,9);e.uniformMatrix3fv(this.addr,!1,t)}function eu(e,n){const t=pn(n,this.size,16);e.uniformMatrix4fv(this.addr,!1,t)}function tu(e,n){e.uniform1iv(this.addr,n)}function nu(e,n){e.uniform2iv(this.addr,n)}function iu(e,n){e.uniform3iv(this.addr,n)}function au(e,n){e.uniform4iv(this.addr,n)}function ru(e,n){e.uniform1uiv(this.addr,n)}function ou(e,n){e.uniform2uiv(this.addr,n)}function su(e,n){e.uniform3uiv(this.addr,n)}function lu(e,n){e.uniform4uiv(this.addr,n)}function cu(e,n,t){const i=this.cache,a=n.length,o=zn(t,a);ft(i,o)||(e.uniform1iv(this.addr,o),ut(i,o));let s;this.type===e.SAMPLER_2D_SHADOW?s=Si:s=yr;for(let d=0;d!==a;++d)t.setTexture2D(n[d]||s,o[d])}function fu(e,n,t){const i=this.cache,a=n.length,o=zn(t,a);ft(i,o)||(e.uniform1iv(this.addr,o),ut(i,o));for(let s=0;s!==a;++s)t.setTexture3D(n[s]||Gr,o[s])}function uu(e,n,t){const i=this.cache,a=n.length,o=zn(t,a);ft(i,o)||(e.uniform1iv(this.addr,o),ut(i,o));for(let s=0;s!==a;++s)t.setTextureCube(n[s]||Or,o[s])}function du(e,n,t){const i=this.cache,a=n.length,o=zn(t,a);ft(i,o)||(e.uniform1iv(this.addr,o),ut(i,o));for(let s=0;s!==a;++s)t.setTexture2DArray(n[s]||Fr,o[s])}function pu(e){switch(e){case 5126:return Kf;case 35664:return $f;case 35665:return Zf;case 35666:return jf;case 35674:return Qf;case 35675:return Jf;case 35676:return eu;case 5124:case 35670:return tu;case 35667:case 35671:return nu;case 35668:case 35672:return iu;case 35669:case 35673:return au;case 5125:return ru;case 36294:return ou;case 36295:return su;case 36296:return lu;case 35678:case 36198:case 36298:case 36306:case 35682:return cu;case 35679:case 36299:case 36307:return fu;case 35680:case 36300:case 36308:case 36293:return uu;case 36289:case 36303:case 36311:case 36292:return du}}class hu{constructor(n,t,i){this.id=n,this.addr=i,this.cache=[],this.type=t.type,this.setValue=Yf(t.type)}}class mu{constructor(n,t,i){this.id=n,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=pu(t.type)}}class _u{constructor(n){this.id=n,this.seq=[],this.map={}}setValue(n,t,i){const a=this.seq;for(let o=0,s=a.length;o!==s;++o){const d=a[o];d.setValue(n,t[d.id],i)}}}const ri=/(\w+)(\])?(\[|\.)?/g;function Ia(e,n){e.seq.push(n),e.map[n.id]=n}function gu(e,n,t){const i=e.name,a=i.length;for(ri.lastIndex=0;;){const o=ri.exec(i),s=ri.lastIndex;let d=o[1];const M=o[2]==="]",g=o[3];if(M&&(d=d|0),g===void 0||g==="["&&s+2===a){Ia(t,g===void 0?new hu(d,e,n):new mu(d,e,n));break}else{let C=t.map[d];C===void 0&&(C=new _u(d),Ia(t,C)),t=C}}}class Gn{constructor(n,t){this.seq=[],this.map={};const i=n.getProgramParameter(t,n.ACTIVE_UNIFORMS);for(let s=0;s<i;++s){const d=n.getActiveUniform(t,s),M=n.getUniformLocation(t,d.name);gu(d,M,this)}const a=[],o=[];for(const s of this.seq)s.type===n.SAMPLER_2D_SHADOW||s.type===n.SAMPLER_CUBE_SHADOW||s.type===n.SAMPLER_2D_ARRAY_SHADOW?a.push(s):o.push(s);a.length>0&&(this.seq=a.concat(o))}setValue(n,t,i,a){const o=this.map[t];o!==void 0&&o.setValue(n,i,a)}setOptional(n,t,i){const a=t[i];a!==void 0&&this.setValue(n,i,a)}static upload(n,t,i,a){for(let o=0,s=t.length;o!==s;++o){const d=t[o],M=i[d.id];M.needsUpdate!==!1&&d.setValue(n,M.value,a)}}static seqWithValue(n,t){const i=[];for(let a=0,o=n.length;a!==o;++a){const s=n[a];s.id in t&&i.push(s)}return i}}function Na(e,n,t){const i=e.createShader(n);return e.shaderSource(i,t),e.compileShader(i),i}const vu=37297;let Su=0;function Eu(e,n){const t=e.split(`
`),i=[],a=Math.max(n-6,0),o=Math.min(n+6,t.length);for(let s=a;s<o;s++){const d=s+1;i.push(`${d===n?">":" "} ${d}: ${t[s]}`)}return i.join(`
`)}const ya=new ye;function xu(e){Je._getMatrix(ya,Je.workingColorSpace,e);const n=`mat3( ${ya.elements.map(t=>t.toFixed(4))} )`;switch(Je.getTransfer(e)){case wr:return[n,"LinearTransferOETF"];case Ze:return[n,"sRGBTransferOETF"];default:return Ve("WebGLProgram: Unsupported color space: ",e),[n,"LinearTransferOETF"]}}function Fa(e,n,t){const i=e.getShaderParameter(n,e.COMPILE_STATUS),o=(e.getShaderInfoLog(n)||"").trim();if(i&&o==="")return"";const s=/ERROR: 0:(\d+)/.exec(o);if(s){const d=parseInt(s[1]);return t.toUpperCase()+`

`+o+`

`+Eu(e.getShaderSource(n),d)}else return o}function Mu(e,n){const t=xu(n);return[`vec4 ${e}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}const Tu={[Pr]:"Linear",[Dr]:"Reinhard",[Cr]:"Cineon",[Rr]:"ACESFilmic",[br]:"AgX",[Ar]:"Neutral",[Tr]:"Custom"};function Au(e,n){const t=Tu[n];return t===void 0?(Ve("WebGLProgram: Unsupported toneMapping:",n),"vec3 "+e+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+e+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Ln=new Ie;function bu(){Je.getLuminanceCoefficients(Ln);const e=Ln.x.toFixed(4),n=Ln.y.toFixed(4),t=Ln.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${e}, ${n}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Ru(e){return[e.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",e.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(vn).join(`
`)}function Cu(e){const n=[];for(const t in e){const i=e[t];i!==!1&&n.push("#define "+t+" "+i)}return n.join(`
`)}function Du(e,n){const t={},i=e.getProgramParameter(n,e.ACTIVE_ATTRIBUTES);for(let a=0;a<i;a++){const o=e.getActiveAttrib(n,a),s=o.name;let d=1;o.type===e.FLOAT_MAT2&&(d=2),o.type===e.FLOAT_MAT3&&(d=3),o.type===e.FLOAT_MAT4&&(d=4),t[s]={type:o.type,location:e.getAttribLocation(n,s),locationSize:d}}return t}function vn(e){return e!==""}function Ga(e,n){const t=n.numSpotLightShadows+n.numSpotLightMaps-n.numSpotLightShadowsWithMaps;return e.replace(/NUM_DIR_LIGHTS/g,n.numDirLights).replace(/NUM_SPOT_LIGHTS/g,n.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,n.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,n.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,n.numPointLights).replace(/NUM_HEMI_LIGHTS/g,n.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,n.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,n.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,n.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,n.numPointLightShadows)}function Oa(e,n){return e.replace(/NUM_CLIPPING_PLANES/g,n.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,n.numClippingPlanes-n.numClipIntersection)}const Pu=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ei(e){return e.replace(Pu,wu)}const Lu=new Map;function wu(e,n){let t=we[n];if(t===void 0){const i=Lu.get(n);if(i!==void 0)t=we[i],Ve('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',n,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+n+">")}return Ei(t)}const Uu=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ba(e){return e.replace(Uu,Iu)}function Iu(e,n,t,i){let a="";for(let o=parseInt(n);o<parseInt(t);o++)a+=i.replace(/\[\s*i\s*\]/g,"[ "+o+" ]").replace(/UNROLLED_LOOP_INDEX/g,o);return a}function Ha(e){let n=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision==="highp"?n+=`
#define HIGH_PRECISION`:e.precision==="mediump"?n+=`
#define MEDIUM_PRECISION`:e.precision==="lowp"&&(n+=`
#define LOW_PRECISION`),n}const Nu={[yn]:"SHADOWMAP_TYPE_PCF",[gn]:"SHADOWMAP_TYPE_VSM"};function yu(e){return Nu[e.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const Fu={[An]:"ENVMAP_TYPE_CUBE",[dn]:"ENVMAP_TYPE_CUBE",[Hn]:"ENVMAP_TYPE_CUBE_UV"};function Gu(e){return e.envMap===!1?"ENVMAP_TYPE_CUBE":Fu[e.envMapMode]||"ENVMAP_TYPE_CUBE"}const Ou={[dn]:"ENVMAP_MODE_REFRACTION"};function Bu(e){return e.envMap===!1?"ENVMAP_MODE_REFLECTION":Ou[e.envMapMode]||"ENVMAP_MODE_REFLECTION"}const Hu={[ds]:"ENVMAP_BLENDING_MULTIPLY",[us]:"ENVMAP_BLENDING_MIX",[fs]:"ENVMAP_BLENDING_ADD"};function Vu(e){return e.envMap===!1?"ENVMAP_BLENDING_NONE":Hu[e.combine]||"ENVMAP_BLENDING_NONE"}function Wu(e){const n=e.envMapCubeUVHeight;if(n===null)return null;const t=Math.log2(n)-2,i=1/n;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function zu(e,n,t,i){const a=e.getContext(),o=t.defines;let s=t.vertexShader,d=t.fragmentShader;const M=yu(t),g=Gu(t),F=Bu(t),C=Vu(t),h=Wu(t),S=Ru(t),R=Cu(o),B=a.createProgram();let u,c,w=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(u=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,R].filter(vn).join(`
`),u.length>0&&(u+=`
`),c=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,R].filter(vn).join(`
`),c.length>0&&(c+=`
`)):(u=[Ha(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,R,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+F:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+M:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(vn).join(`
`),c=[Ha(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,R,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+g:"",t.envMap?"#define "+F:"",t.envMap?"#define "+C:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+M:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Ot?"#define TONE_MAPPING":"",t.toneMapping!==Ot?we.tonemapping_pars_fragment:"",t.toneMapping!==Ot?Au("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",we.colorspace_pars_fragment,Mu("linearToOutputTexel",t.outputColorSpace),bu(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(vn).join(`
`)),s=Ei(s),s=Ga(s,t),s=Oa(s,t),d=Ei(d),d=Ga(d,t),d=Oa(d,t),s=Ba(s),d=Ba(d),t.isRawShaderMaterial!==!0&&(w=`#version 300 es
`,u=[S,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+u,c=["#define varying in",t.glslVersion===xa?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===xa?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+c);const I=w+u+s,m=w+c+d,A=Na(a,a.VERTEX_SHADER,I),v=Na(a,a.FRAGMENT_SHADER,m);a.attachShader(B,A),a.attachShader(B,v),t.index0AttributeName!==void 0?a.bindAttribLocation(B,0,t.index0AttributeName):t.hasPositionAttribute===!0&&a.bindAttribLocation(B,0,"position"),a.linkProgram(B);function P(D){if(e.debug.checkShaderErrors){const O=a.getProgramInfoLog(B)||"",j=a.getShaderInfoLog(A)||"",K=a.getShaderInfoLog(v)||"",z=O.trim(),q=j.trim(),V=K.trim();let Z=!0,ee=!0;if(a.getProgramParameter(B,a.LINK_STATUS)===!1)if(Z=!1,typeof e.debug.onShaderError=="function")e.debug.onShaderError(a,B,A,v);else{const ce=Fa(a,A,"vertex"),_e=Fa(a,v,"fragment");je("WebGLProgram: Shader Error "+a.getError()+" - VALIDATE_STATUS "+a.getProgramParameter(B,a.VALIDATE_STATUS)+`

Material Name: `+D.name+`
Material Type: `+D.type+`

Program Info Log: `+z+`
`+ce+`
`+_e)}else z!==""?Ve("WebGLProgram: Program Info Log:",z):(q===""||V==="")&&(ee=!1);ee&&(D.diagnostics={runnable:Z,programLog:z,vertexShader:{log:q,prefix:u},fragmentShader:{log:V,prefix:c}})}a.deleteShader(A),a.deleteShader(v),f=new Gn(a,B),_=Du(a,B)}let f;this.getUniforms=function(){return f===void 0&&P(this),f};let _;this.getAttributes=function(){return _===void 0&&P(this),_};let y=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return y===!1&&(y=a.getProgramParameter(B,vu)),y},this.destroy=function(){i.releaseStatesOfProgram(this),a.deleteProgram(B),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Su++,this.cacheKey=n,this.usedTimes=1,this.program=B,this.vertexShader=A,this.fragmentShader=v,this}let ku=0;class Xu{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(n,t,i){const a=this._getShaderCacheForMaterial(n);return a.has(t)===!1&&(a.add(t),t.usedTimes++),a.has(i)===!1&&(a.add(i),i.usedTimes++),this}remove(n){const t=this.materialCache.get(n);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(n),this}getVertexShaderStage(n){return this._getShaderStage(n.vertexShader)}getFragmentShaderStage(n){return this._getShaderStage(n.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(n){const t=this.materialCache;let i=t.get(n);return i===void 0&&(i=new Set,t.set(n,i)),i}_getShaderStage(n){const t=this.shaderCache;let i=t.get(n);return i===void 0&&(i=new qu(n),t.set(n,i)),i}}class qu{constructor(n){this.id=ku++,this.code=n,this.usedTimes=0}}function Yu(e){return e===an||e===_i||e===gi}function Ku(e,n,t,i,a,o){const s=new ss,d=new Xu,M=new Set,g=[],F=new Map,C=i.logarithmicDepthBuffer;let h=i.precision;const S={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function R(f){return M.add(f),f===0?"uv":`uv${f}`}function B(f,_,y,D,O,j){const K=D.fog,z=O.geometry,q=f.isMeshStandardMaterial||f.isMeshLambertMaterial||f.isMeshPhongMaterial?D.environment:null,V=f.isMeshStandardMaterial||f.isMeshLambertMaterial&&!f.envMap||f.isMeshPhongMaterial&&!f.envMap,Z=n.get(f.envMap||q,V),ee=Z&&Z.mapping===Hn?Z.image.height:null,ce=S[f.type];f.precision!==null&&(h=i.getMaxPrecision(f.precision),h!==f.precision&&Ve("WebGLProgram.getParameters:",f.precision,"not supported, using",h,"instead."));const _e=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,ve=_e!==void 0?_e.length:0;let Oe=0;z.morphAttributes.position!==void 0&&(Oe=1),z.morphAttributes.normal!==void 0&&(Oe=2),z.morphAttributes.color!==void 0&&(Oe=3);let Qe,Be,k,ne;if(ce){const me=yt[ce];Qe=me.vertexShader,Be=me.fragmentShader}else{Qe=f.vertexShader,Be=f.fragmentShader;const me=d.getVertexShaderStage(f),tt=d.getFragmentShaderStage(f);d.update(f,me,tt),k=me.id,ne=tt.id}const Q=e.getRenderTarget(),Re=e.state.buffers.depth.getReversed(),Ce=O.isInstancedMesh===!0,Ae=O.isBatchedMesh===!0,at=!!f.map,Ne=!!f.matcap,ke=!!Z,He=!!f.aoMap,Fe=!!f.lightMap,st=!!f.bumpMap&&f.wireframe===!1,ct=!!f.normalMap,dt=!!f.displacementMap,ht=!!f.emissiveMap,et=!!f.metalnessMap,lt=!!f.roughnessMap,x=f.anisotropy>0,Et=f.clearcoat>0,We=f.dispersion>0,p=f.iridescence>0,r=f.sheen>0,b=f.transmission>0,N=x&&!!f.anisotropyMap,H=Et&&!!f.clearcoatMap,J=Et&&!!f.clearcoatNormalMap,ie=Et&&!!f.clearcoatRoughnessMap,W=p&&!!f.iridescenceMap,Y=p&&!!f.iridescenceThicknessMap,ae=r&&!!f.sheenColorMap,Ee=r&&!!f.sheenRoughnessMap,se=!!f.specularMap,re=!!f.specularColorMap,Te=!!f.specularIntensityMap,be=b&&!!f.transmissionMap,De=b&&!!f.thicknessMap,E=!!f.gradientMap,te=!!f.alphaMap,X=f.alphaTest>0,oe=!!f.alphaHash,de=!!f.extensions;let $=Ot;f.toneMapped&&(Q===null||Q.isXRRenderTarget===!0)&&($=e.toneMapping);const Se={shaderID:ce,shaderType:f.type,shaderName:f.name,vertexShader:Qe,fragmentShader:Be,defines:f.defines,customVertexShaderID:k,customFragmentShaderID:ne,isRawShaderMaterial:f.isRawShaderMaterial===!0,glslVersion:f.glslVersion,precision:h,batching:Ae,batchingColor:Ae&&O._colorsTexture!==null,instancing:Ce,instancingColor:Ce&&O.instanceColor!==null,instancingMorph:Ce&&O.morphTexture!==null,outputColorSpace:Q===null?e.outputColorSpace:Q.isXRRenderTarget===!0?Q.texture.colorSpace:Je.workingColorSpace,alphaToCoverage:!!f.alphaToCoverage,map:at,matcap:Ne,envMap:ke,envMapMode:ke&&Z.mapping,envMapCubeUVHeight:ee,aoMap:He,lightMap:Fe,bumpMap:st,normalMap:ct,displacementMap:dt,emissiveMap:ht,normalMapObjectSpace:ct&&f.normalMapType===is,normalMapTangentSpace:ct&&f.normalMapType===Sa,packedNormalMap:ct&&f.normalMapType===Sa&&Yu(f.normalMap.format),metalnessMap:et,roughnessMap:lt,anisotropy:x,anisotropyMap:N,clearcoat:Et,clearcoatMap:H,clearcoatNormalMap:J,clearcoatRoughnessMap:ie,dispersion:We,iridescence:p,iridescenceMap:W,iridescenceThicknessMap:Y,sheen:r,sheenColorMap:ae,sheenRoughnessMap:Ee,specularMap:se,specularColorMap:re,specularIntensityMap:Te,transmission:b,transmissionMap:be,thicknessMap:De,gradientMap:E,opaque:f.transparent===!1&&f.blending===Fn&&f.alphaToCoverage===!1,alphaMap:te,alphaTest:X,alphaHash:oe,combine:f.combine,mapUv:at&&R(f.map.channel),aoMapUv:He&&R(f.aoMap.channel),lightMapUv:Fe&&R(f.lightMap.channel),bumpMapUv:st&&R(f.bumpMap.channel),normalMapUv:ct&&R(f.normalMap.channel),displacementMapUv:dt&&R(f.displacementMap.channel),emissiveMapUv:ht&&R(f.emissiveMap.channel),metalnessMapUv:et&&R(f.metalnessMap.channel),roughnessMapUv:lt&&R(f.roughnessMap.channel),anisotropyMapUv:N&&R(f.anisotropyMap.channel),clearcoatMapUv:H&&R(f.clearcoatMap.channel),clearcoatNormalMapUv:J&&R(f.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ie&&R(f.clearcoatRoughnessMap.channel),iridescenceMapUv:W&&R(f.iridescenceMap.channel),iridescenceThicknessMapUv:Y&&R(f.iridescenceThicknessMap.channel),sheenColorMapUv:ae&&R(f.sheenColorMap.channel),sheenRoughnessMapUv:Ee&&R(f.sheenRoughnessMap.channel),specularMapUv:se&&R(f.specularMap.channel),specularColorMapUv:re&&R(f.specularColorMap.channel),specularIntensityMapUv:Te&&R(f.specularIntensityMap.channel),transmissionMapUv:be&&R(f.transmissionMap.channel),thicknessMapUv:De&&R(f.thicknessMap.channel),alphaMapUv:te&&R(f.alphaMap.channel),vertexTangents:!!z.attributes.tangent&&(ct||x),vertexNormals:!!z.attributes.normal,vertexColors:f.vertexColors,vertexAlphas:f.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,pointsUvs:O.isPoints===!0&&!!z.attributes.uv&&(at||te),fog:!!K,useFog:f.fog===!0,fogExp2:!!K&&K.isFogExp2,flatShading:f.wireframe===!1&&(f.flatShading===!0||z.attributes.normal===void 0&&ct===!1&&(f.isMeshLambertMaterial||f.isMeshPhongMaterial||f.isMeshStandardMaterial||f.isMeshPhysicalMaterial)),sizeAttenuation:f.sizeAttenuation===!0,logarithmicDepthBuffer:C,reversedDepthBuffer:Re,skinning:O.isSkinnedMesh===!0,hasPositionAttribute:z.attributes.position!==void 0,morphTargets:z.morphAttributes.position!==void 0,morphNormals:z.morphAttributes.normal!==void 0,morphColors:z.morphAttributes.color!==void 0,morphTargetsCount:ve,morphTextureStride:Oe,numDirLights:_.directional.length,numPointLights:_.point.length,numSpotLights:_.spot.length,numSpotLightMaps:_.spotLightMap.length,numRectAreaLights:_.rectArea.length,numHemiLights:_.hemi.length,numDirLightShadows:_.directionalShadowMap.length,numPointLightShadows:_.pointShadowMap.length,numSpotLightShadows:_.spotShadowMap.length,numSpotLightShadowsWithMaps:_.numSpotLightShadowsWithMaps,numLightProbes:_.numLightProbes,numLightProbeGrids:j.length,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:f.dithering,shadowMapEnabled:e.shadowMap.enabled&&y.length>0,shadowMapType:e.shadowMap.type,toneMapping:$,decodeVideoTexture:at&&f.map.isVideoTexture===!0&&Je.getTransfer(f.map.colorSpace)===Ze,decodeVideoTextureEmissive:ht&&f.emissiveMap.isVideoTexture===!0&&Je.getTransfer(f.emissiveMap.colorSpace)===Ze,premultipliedAlpha:f.premultipliedAlpha,doubleSided:f.side===Ft,flipSided:f.side===At,useDepthPacking:f.depthPacking>=0,depthPacking:f.depthPacking||0,index0AttributeName:f.index0AttributeName,extensionClipCullDistance:de&&f.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(de&&f.extensions.multiDraw===!0||Ae)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:f.customProgramCacheKey()};return Se.vertexUv1s=M.has(1),Se.vertexUv2s=M.has(2),Se.vertexUv3s=M.has(3),M.clear(),Se}function u(f){const _=[];if(f.shaderID?_.push(f.shaderID):(_.push(f.customVertexShaderID),_.push(f.customFragmentShaderID)),f.defines!==void 0)for(const y in f.defines)_.push(y),_.push(f.defines[y]);return f.isRawShaderMaterial===!1&&(c(_,f),w(_,f),_.push(e.outputColorSpace)),_.push(f.customProgramCacheKey),_.join()}function c(f,_){f.push(_.precision),f.push(_.outputColorSpace),f.push(_.envMapMode),f.push(_.envMapCubeUVHeight),f.push(_.mapUv),f.push(_.alphaMapUv),f.push(_.lightMapUv),f.push(_.aoMapUv),f.push(_.bumpMapUv),f.push(_.normalMapUv),f.push(_.displacementMapUv),f.push(_.emissiveMapUv),f.push(_.metalnessMapUv),f.push(_.roughnessMapUv),f.push(_.anisotropyMapUv),f.push(_.clearcoatMapUv),f.push(_.clearcoatNormalMapUv),f.push(_.clearcoatRoughnessMapUv),f.push(_.iridescenceMapUv),f.push(_.iridescenceThicknessMapUv),f.push(_.sheenColorMapUv),f.push(_.sheenRoughnessMapUv),f.push(_.specularMapUv),f.push(_.specularColorMapUv),f.push(_.specularIntensityMapUv),f.push(_.transmissionMapUv),f.push(_.thicknessMapUv),f.push(_.combine),f.push(_.fogExp2),f.push(_.sizeAttenuation),f.push(_.morphTargetsCount),f.push(_.morphAttributeCount),f.push(_.numDirLights),f.push(_.numPointLights),f.push(_.numSpotLights),f.push(_.numSpotLightMaps),f.push(_.numHemiLights),f.push(_.numRectAreaLights),f.push(_.numDirLightShadows),f.push(_.numPointLightShadows),f.push(_.numSpotLightShadows),f.push(_.numSpotLightShadowsWithMaps),f.push(_.numLightProbes),f.push(_.shadowMapType),f.push(_.toneMapping),f.push(_.numClippingPlanes),f.push(_.numClipIntersection),f.push(_.depthPacking)}function w(f,_){s.disableAll(),_.instancing&&s.enable(0),_.instancingColor&&s.enable(1),_.instancingMorph&&s.enable(2),_.matcap&&s.enable(3),_.envMap&&s.enable(4),_.normalMapObjectSpace&&s.enable(5),_.normalMapTangentSpace&&s.enable(6),_.clearcoat&&s.enable(7),_.iridescence&&s.enable(8),_.alphaTest&&s.enable(9),_.vertexColors&&s.enable(10),_.vertexAlphas&&s.enable(11),_.vertexUv1s&&s.enable(12),_.vertexUv2s&&s.enable(13),_.vertexUv3s&&s.enable(14),_.vertexTangents&&s.enable(15),_.anisotropy&&s.enable(16),_.alphaHash&&s.enable(17),_.batching&&s.enable(18),_.dispersion&&s.enable(19),_.batchingColor&&s.enable(20),_.gradientMap&&s.enable(21),_.packedNormalMap&&s.enable(22),_.vertexNormals&&s.enable(23),f.push(s.mask),s.disableAll(),_.fog&&s.enable(0),_.useFog&&s.enable(1),_.flatShading&&s.enable(2),_.logarithmicDepthBuffer&&s.enable(3),_.reversedDepthBuffer&&s.enable(4),_.skinning&&s.enable(5),_.morphTargets&&s.enable(6),_.morphNormals&&s.enable(7),_.morphColors&&s.enable(8),_.premultipliedAlpha&&s.enable(9),_.shadowMapEnabled&&s.enable(10),_.doubleSided&&s.enable(11),_.flipSided&&s.enable(12),_.useDepthPacking&&s.enable(13),_.dithering&&s.enable(14),_.transmission&&s.enable(15),_.sheen&&s.enable(16),_.opaque&&s.enable(17),_.pointsUvs&&s.enable(18),_.decodeVideoTexture&&s.enable(19),_.decodeVideoTextureEmissive&&s.enable(20),_.alphaToCoverage&&s.enable(21),_.numLightProbeGrids>0&&s.enable(22),_.hasPositionAttribute&&s.enable(23),f.push(s.mask)}function I(f){const _=S[f.type];let y;if(_){const D=yt[_];y=ns.clone(D.uniforms)}else y=f.uniforms;return y}function m(f,_){let y=F.get(_);return y!==void 0?++y.usedTimes:(y=new zu(e,_,f,a),g.push(y),F.set(_,y)),y}function A(f){if(--f.usedTimes===0){const _=g.indexOf(f);g[_]=g[g.length-1],g.pop(),F.delete(f.cacheKey),f.destroy()}}function v(f){d.remove(f)}function P(){d.dispose()}return{getParameters:B,getProgramCacheKey:u,getUniforms:I,acquireProgram:m,releaseProgram:A,releaseShaderCache:v,programs:g,dispose:P}}function $u(){let e=new WeakMap;function n(s){return e.has(s)}function t(s){let d=e.get(s);return d===void 0&&(d={},e.set(s,d)),d}function i(s){e.delete(s)}function a(s,d,M){e.get(s)[d]=M}function o(){e=new WeakMap}return{has:n,get:t,remove:i,update:a,dispose:o}}function Zu(e,n){return e.groupOrder!==n.groupOrder?e.groupOrder-n.groupOrder:e.renderOrder!==n.renderOrder?e.renderOrder-n.renderOrder:e.material.id!==n.material.id?e.material.id-n.material.id:e.materialVariant!==n.materialVariant?e.materialVariant-n.materialVariant:e.z!==n.z?e.z-n.z:e.id-n.id}function Va(e,n){return e.groupOrder!==n.groupOrder?e.groupOrder-n.groupOrder:e.renderOrder!==n.renderOrder?e.renderOrder-n.renderOrder:e.z!==n.z?n.z-e.z:e.id-n.id}function Wa(){const e=[];let n=0;const t=[],i=[],a=[];function o(){n=0,t.length=0,i.length=0,a.length=0}function s(h){let S=0;return h.isInstancedMesh&&(S+=2),h.isSkinnedMesh&&(S+=1),S}function d(h,S,R,B,u,c){let w=e[n];return w===void 0?(w={id:h.id,object:h,geometry:S,material:R,materialVariant:s(h),groupOrder:B,renderOrder:h.renderOrder,z:u,group:c},e[n]=w):(w.id=h.id,w.object=h,w.geometry=S,w.material=R,w.materialVariant=s(h),w.groupOrder=B,w.renderOrder=h.renderOrder,w.z=u,w.group=c),n++,w}function M(h,S,R,B,u,c){const w=d(h,S,R,B,u,c);R.transmission>0?i.push(w):R.transparent===!0?a.push(w):t.push(w)}function g(h,S,R,B,u,c){const w=d(h,S,R,B,u,c);R.transmission>0?i.unshift(w):R.transparent===!0?a.unshift(w):t.unshift(w)}function F(h,S,R){t.length>1&&t.sort(h||Zu),i.length>1&&i.sort(S||Va),a.length>1&&a.sort(S||Va),R&&(t.reverse(),i.reverse(),a.reverse())}function C(){for(let h=n,S=e.length;h<S;h++){const R=e[h];if(R.id===null)break;R.id=null,R.object=null,R.geometry=null,R.material=null,R.group=null}}return{opaque:t,transmissive:i,transparent:a,init:o,push:M,unshift:g,finish:C,sort:F}}function ju(){let e=new WeakMap;function n(i,a){const o=e.get(i);let s;return o===void 0?(s=new Wa,e.set(i,[s])):a>=o.length?(s=new Wa,o.push(s)):s=o[a],s}function t(){e=new WeakMap}return{get:n,dispose:t}}function Qu(){const e={};return{get:function(n){if(e[n.id]!==void 0)return e[n.id];let t;switch(n.type){case"DirectionalLight":t={direction:new Ie,color:new Ye};break;case"SpotLight":t={position:new Ie,direction:new Ie,color:new Ye,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new Ie,color:new Ye,distance:0,decay:0};break;case"HemisphereLight":t={direction:new Ie,skyColor:new Ye,groundColor:new Ye};break;case"RectAreaLight":t={color:new Ye,position:new Ie,halfWidth:new Ie,halfHeight:new Ie};break}return e[n.id]=t,t}}}function Ju(){const e={};return{get:function(n){if(e[n.id]!==void 0)return e[n.id];let t;switch(n.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new it};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new it};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new it,shadowCameraNear:1,shadowCameraFar:1e3};break}return e[n.id]=t,t}}}let ed=0;function td(e,n){return(n.castShadow?2:0)-(e.castShadow?2:0)+(n.map?1:0)-(e.map?1:0)}function nd(e){const n=new Qu,t=Ju(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let g=0;g<9;g++)i.probe.push(new Ie);const a=new Ie,o=new tn,s=new tn;function d(g){let F=0,C=0,h=0;for(let _=0;_<9;_++)i.probe[_].set(0,0,0);let S=0,R=0,B=0,u=0,c=0,w=0,I=0,m=0,A=0,v=0,P=0;g.sort(td);for(let _=0,y=g.length;_<y;_++){const D=g[_],O=D.color,j=D.intensity,K=D.distance;let z=null;if(D.shadow&&D.shadow.map&&(D.shadow.map.texture.format===an?z=D.shadow.map.texture:z=D.shadow.map.depthTexture||D.shadow.map.texture),D.isAmbientLight)F+=O.r*j,C+=O.g*j,h+=O.b*j;else if(D.isLightProbe){for(let q=0;q<9;q++)i.probe[q].addScaledVector(D.sh.coefficients[q],j);P++}else if(D.isDirectionalLight){const q=n.get(D);if(q.color.copy(D.color).multiplyScalar(D.intensity),D.castShadow){const V=D.shadow,Z=t.get(D);Z.shadowIntensity=V.intensity,Z.shadowBias=V.bias,Z.shadowNormalBias=V.normalBias,Z.shadowRadius=V.radius,Z.shadowMapSize=V.mapSize,i.directionalShadow[S]=Z,i.directionalShadowMap[S]=z,i.directionalShadowMatrix[S]=D.shadow.matrix,w++}i.directional[S]=q,S++}else if(D.isSpotLight){const q=n.get(D);q.position.setFromMatrixPosition(D.matrixWorld),q.color.copy(O).multiplyScalar(j),q.distance=K,q.coneCos=Math.cos(D.angle),q.penumbraCos=Math.cos(D.angle*(1-D.penumbra)),q.decay=D.decay,i.spot[B]=q;const V=D.shadow;if(D.map&&(i.spotLightMap[A]=D.map,A++,V.updateMatrices(D),D.castShadow&&v++),i.spotLightMatrix[B]=V.matrix,D.castShadow){const Z=t.get(D);Z.shadowIntensity=V.intensity,Z.shadowBias=V.bias,Z.shadowNormalBias=V.normalBias,Z.shadowRadius=V.radius,Z.shadowMapSize=V.mapSize,i.spotShadow[B]=Z,i.spotShadowMap[B]=z,m++}B++}else if(D.isRectAreaLight){const q=n.get(D);q.color.copy(O).multiplyScalar(j),q.halfWidth.set(D.width*.5,0,0),q.halfHeight.set(0,D.height*.5,0),i.rectArea[u]=q,u++}else if(D.isPointLight){const q=n.get(D);if(q.color.copy(D.color).multiplyScalar(D.intensity),q.distance=D.distance,q.decay=D.decay,D.castShadow){const V=D.shadow,Z=t.get(D);Z.shadowIntensity=V.intensity,Z.shadowBias=V.bias,Z.shadowNormalBias=V.normalBias,Z.shadowRadius=V.radius,Z.shadowMapSize=V.mapSize,Z.shadowCameraNear=V.camera.near,Z.shadowCameraFar=V.camera.far,i.pointShadow[R]=Z,i.pointShadowMap[R]=z,i.pointShadowMatrix[R]=D.shadow.matrix,I++}i.point[R]=q,R++}else if(D.isHemisphereLight){const q=n.get(D);q.skyColor.copy(D.color).multiplyScalar(j),q.groundColor.copy(D.groundColor).multiplyScalar(j),i.hemi[c]=q,c++}}u>0&&(e.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=le.LTC_FLOAT_1,i.rectAreaLTC2=le.LTC_FLOAT_2):(i.rectAreaLTC1=le.LTC_HALF_1,i.rectAreaLTC2=le.LTC_HALF_2)),i.ambient[0]=F,i.ambient[1]=C,i.ambient[2]=h;const f=i.hash;(f.directionalLength!==S||f.pointLength!==R||f.spotLength!==B||f.rectAreaLength!==u||f.hemiLength!==c||f.numDirectionalShadows!==w||f.numPointShadows!==I||f.numSpotShadows!==m||f.numSpotMaps!==A||f.numLightProbes!==P)&&(i.directional.length=S,i.spot.length=B,i.rectArea.length=u,i.point.length=R,i.hemi.length=c,i.directionalShadow.length=w,i.directionalShadowMap.length=w,i.pointShadow.length=I,i.pointShadowMap.length=I,i.spotShadow.length=m,i.spotShadowMap.length=m,i.directionalShadowMatrix.length=w,i.pointShadowMatrix.length=I,i.spotLightMatrix.length=m+A-v,i.spotLightMap.length=A,i.numSpotLightShadowsWithMaps=v,i.numLightProbes=P,f.directionalLength=S,f.pointLength=R,f.spotLength=B,f.rectAreaLength=u,f.hemiLength=c,f.numDirectionalShadows=w,f.numPointShadows=I,f.numSpotShadows=m,f.numSpotMaps=A,f.numLightProbes=P,i.version=ed++)}function M(g,F){let C=0,h=0,S=0,R=0,B=0;const u=F.matrixWorldInverse;for(let c=0,w=g.length;c<w;c++){const I=g[c];if(I.isDirectionalLight){const m=i.directional[C];m.direction.setFromMatrixPosition(I.matrixWorld),a.setFromMatrixPosition(I.target.matrixWorld),m.direction.sub(a),m.direction.transformDirection(u),C++}else if(I.isSpotLight){const m=i.spot[S];m.position.setFromMatrixPosition(I.matrixWorld),m.position.applyMatrix4(u),m.direction.setFromMatrixPosition(I.matrixWorld),a.setFromMatrixPosition(I.target.matrixWorld),m.direction.sub(a),m.direction.transformDirection(u),S++}else if(I.isRectAreaLight){const m=i.rectArea[R];m.position.setFromMatrixPosition(I.matrixWorld),m.position.applyMatrix4(u),s.identity(),o.copy(I.matrixWorld),o.premultiply(u),s.extractRotation(o),m.halfWidth.set(I.width*.5,0,0),m.halfHeight.set(0,I.height*.5,0),m.halfWidth.applyMatrix4(s),m.halfHeight.applyMatrix4(s),R++}else if(I.isPointLight){const m=i.point[h];m.position.setFromMatrixPosition(I.matrixWorld),m.position.applyMatrix4(u),h++}else if(I.isHemisphereLight){const m=i.hemi[B];m.direction.setFromMatrixPosition(I.matrixWorld),m.direction.transformDirection(u),B++}}}return{setup:d,setupView:M,state:i}}function za(e){const n=new nd(e),t=[],i=[],a=[];function o(h){C.camera=h,t.length=0,i.length=0,a.length=0}function s(h){t.push(h)}function d(h){i.push(h)}function M(h){a.push(h)}function g(){n.setup(t)}function F(h){n.setupView(t,h)}const C={lightsArray:t,shadowsArray:i,lightProbeGridArray:a,camera:null,lights:n,transmissionRenderTarget:{},textureUnits:0};return{init:o,state:C,setupLights:g,setupLightsView:F,pushLight:s,pushShadow:d,pushLightProbeGrid:M}}function id(e){let n=new WeakMap;function t(a,o=0){const s=n.get(a);let d;return s===void 0?(d=new za(e),n.set(a,[d])):o>=s.length?(d=new za(e),s.push(d)):d=s[o],d}function i(){n=new WeakMap}return{get:t,dispose:i}}const ad=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,rd=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,od=[new Ie(1,0,0),new Ie(-1,0,0),new Ie(0,1,0),new Ie(0,-1,0),new Ie(0,0,1),new Ie(0,0,-1)],sd=[new Ie(0,-1,0),new Ie(0,-1,0),new Ie(0,0,1),new Ie(0,0,-1),new Ie(0,-1,0),new Ie(0,-1,0)],ka=new tn,_n=new Ie,oi=new Ie;function ld(e,n,t){let i=new xi;const a=new it,o=new it,s=new pt,d=new No,M=new yo,g={},F=t.maxTextureSize,C={[En]:At,[At]:En,[Ft]:Ft},h=new Vt({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new it},radius:{value:4}},vertexShader:ad,fragmentShader:rd}),S=h.clone();S.defines.HORIZONTAL_PASS=1;const R=new bn;R.setAttribute("position",new Nn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const B=new Ht(R,h),u=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=yn;let c=this.type;this.render=function(v,P,f){if(u.enabled===!1||u.autoUpdate===!1&&u.needsUpdate===!1||v.length===0)return;this.type===Fo&&(Ve("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=yn);const _=e.getRenderTarget(),y=e.getActiveCubeFace(),D=e.getActiveMipmapLevel(),O=e.state;O.setBlending(Wt),O.buffers.depth.getReversed()===!0?O.buffers.color.setClear(0,0,0,0):O.buffers.color.setClear(1,1,1,1),O.buffers.depth.setTest(!0),O.setScissorTest(!1);const j=c!==this.type;j&&P.traverse(function(K){K.material&&(Array.isArray(K.material)?K.material.forEach(z=>z.needsUpdate=!0):K.material.needsUpdate=!0)});for(let K=0,z=v.length;K<z;K++){const q=v[K],V=q.shadow;if(V===void 0){Ve("WebGLShadowMap:",q,"has no shadow.");continue}if(V.autoUpdate===!1&&V.needsUpdate===!1)continue;a.copy(V.mapSize);const Z=V.getFrameExtents();a.multiply(Z),o.copy(V.mapSize),(a.x>F||a.y>F)&&(a.x>F&&(o.x=Math.floor(F/Z.x),a.x=o.x*Z.x,V.mapSize.x=o.x),a.y>F&&(o.y=Math.floor(F/Z.y),a.y=o.y*Z.y,V.mapSize.y=o.y));const ee=e.state.buffers.depth.getReversed();if(V.camera._reversedDepth=ee,V.map===null||j===!0){if(V.map!==null&&(V.map.depthTexture!==null&&(V.map.depthTexture.dispose(),V.map.depthTexture=null),V.map.dispose()),this.type===gn){if(q.isPointLight){Ve("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}V.map=new Pt(a.x,a.y,{format:an,type:Bt,minFilter:_t,magFilter:_t,generateMipmaps:!1}),V.map.texture.name=q.name+".shadowMap",V.map.depthTexture=new xn(a.x,a.y,Kt),V.map.depthTexture.name=q.name+".shadowMapDepth",V.map.depthTexture.format=un,V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=Jt,V.map.depthTexture.magFilter=Jt}else q.isPointLight?(V.map=new Nr(a.x),V.map.depthTexture=new Go(a.x,nn)):(V.map=new Pt(a.x,a.y),V.map.depthTexture=new xn(a.x,a.y,nn)),V.map.depthTexture.name=q.name+".shadowMap",V.map.depthTexture.format=un,this.type===yn?(V.map.depthTexture.compareFunction=ee?Ti:Ai,V.map.depthTexture.minFilter=_t,V.map.depthTexture.magFilter=_t):(V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=Jt,V.map.depthTexture.magFilter=Jt);V.camera.updateProjectionMatrix()}const ce=V.map.isWebGLCubeRenderTarget?6:1;for(let _e=0;_e<ce;_e++){if(V.map.isWebGLCubeRenderTarget)e.setRenderTarget(V.map,_e),e.clear();else{_e===0&&(e.setRenderTarget(V.map),e.clear());const ve=V.getViewport(_e);s.set(o.x*ve.x,o.y*ve.y,o.x*ve.z,o.y*ve.w),O.viewport(s)}if(q.isPointLight){const ve=V.camera,Oe=V.matrix,Qe=q.distance||ve.far;Qe!==ve.far&&(ve.far=Qe,ve.updateProjectionMatrix()),_n.setFromMatrixPosition(q.matrixWorld),ve.position.copy(_n),oi.copy(ve.position),oi.add(od[_e]),ve.up.copy(sd[_e]),ve.lookAt(oi),ve.updateMatrixWorld(),Oe.makeTranslation(-_n.x,-_n.y,-_n.z),ka.multiplyMatrices(ve.projectionMatrix,ve.matrixWorldInverse),V._frustum.setFromProjectionMatrix(ka,ve.coordinateSystem,ve.reversedDepth)}else V.updateMatrices(q);i=V.getFrustum(),m(P,f,V.camera,q,this.type)}V.isPointLightShadow!==!0&&this.type===gn&&w(V,f),V.needsUpdate=!1}c=this.type,u.needsUpdate=!1,e.setRenderTarget(_,y,D)};function w(v,P){const f=n.update(B);h.defines.VSM_SAMPLES!==v.blurSamples&&(h.defines.VSM_SAMPLES=v.blurSamples,S.defines.VSM_SAMPLES=v.blurSamples,h.needsUpdate=!0,S.needsUpdate=!0),v.mapPass===null&&(v.mapPass=new Pt(a.x,a.y,{format:an,type:Bt})),h.uniforms.shadow_pass.value=v.map.depthTexture,h.uniforms.resolution.value=v.mapSize,h.uniforms.radius.value=v.radius,e.setRenderTarget(v.mapPass),e.clear(),e.renderBufferDirect(P,null,f,h,B,null),S.uniforms.shadow_pass.value=v.mapPass.texture,S.uniforms.resolution.value=v.mapSize,S.uniforms.radius.value=v.radius,e.setRenderTarget(v.map),e.clear(),e.renderBufferDirect(P,null,f,S,B,null)}function I(v,P,f,_){let y=null;const D=f.isPointLight===!0?v.customDistanceMaterial:v.customDepthMaterial;if(D!==void 0)y=D;else if(y=f.isPointLight===!0?M:d,e.localClippingEnabled&&P.clipShadows===!0&&Array.isArray(P.clippingPlanes)&&P.clippingPlanes.length!==0||P.displacementMap&&P.displacementScale!==0||P.alphaMap&&P.alphaTest>0||P.map&&P.alphaTest>0||P.alphaToCoverage===!0){const O=y.uuid,j=P.uuid;let K=g[O];K===void 0&&(K={},g[O]=K);let z=K[j];z===void 0&&(z=y.clone(),K[j]=z,P.addEventListener("dispose",A)),y=z}if(y.visible=P.visible,y.wireframe=P.wireframe,_===gn?y.side=P.shadowSide!==null?P.shadowSide:P.side:y.side=P.shadowSide!==null?P.shadowSide:C[P.side],y.alphaMap=P.alphaMap,y.alphaTest=P.alphaToCoverage===!0?.5:P.alphaTest,y.map=P.map,y.clipShadows=P.clipShadows,y.clippingPlanes=P.clippingPlanes,y.clipIntersection=P.clipIntersection,y.displacementMap=P.displacementMap,y.displacementScale=P.displacementScale,y.displacementBias=P.displacementBias,y.wireframeLinewidth=P.wireframeLinewidth,y.linewidth=P.linewidth,f.isPointLight===!0&&y.isMeshDistanceMaterial===!0){const O=e.properties.get(y);O.light=f}return y}function m(v,P,f,_,y){if(v.visible===!1)return;if(v.layers.test(P.layers)&&(v.isMesh||v.isLine||v.isPoints)&&(v.castShadow||v.receiveShadow&&y===gn)&&(!v.frustumCulled||i.intersectsObject(v))){v.modelViewMatrix.multiplyMatrices(f.matrixWorldInverse,v.matrixWorld);const j=n.update(v),K=v.material;if(Array.isArray(K)){const z=j.groups;for(let q=0,V=z.length;q<V;q++){const Z=z[q],ee=K[Z.materialIndex];if(ee&&ee.visible){const ce=I(v,ee,_,y);v.onBeforeShadow(e,v,P,f,j,ce,Z),e.renderBufferDirect(f,null,j,ce,v,Z),v.onAfterShadow(e,v,P,f,j,ce,Z)}}}else if(K.visible){const z=I(v,K,_,y);v.onBeforeShadow(e,v,P,f,j,z,null),e.renderBufferDirect(f,null,j,z,v,null),v.onAfterShadow(e,v,P,f,j,z,null)}}const O=v.children;for(let j=0,K=O.length;j<K;j++)m(O[j],P,f,_,y)}function A(v){v.target.removeEventListener("dispose",A);for(const f in g){const _=g[f],y=v.target.uuid;y in _&&(_[y].dispose(),delete _[y])}}}function cd(e,n){function t(){let E=!1;const te=new pt;let X=null;const oe=new pt(0,0,0,0);return{setMask:function(de){X!==de&&!E&&(e.colorMask(de,de,de,de),X=de)},setLocked:function(de){E=de},setClear:function(de,$,Se,me,tt){tt===!0&&(de*=me,$*=me,Se*=me),te.set(de,$,Se,me),oe.equals(te)===!1&&(e.clearColor(de,$,Se,me),oe.copy(te))},reset:function(){E=!1,X=null,oe.set(-1,0,0,0)}}}function i(){let E=!1,te=!1,X=null,oe=null,de=null;return{setReversed:function($){if(te!==$){const Se=n.get("EXT_clip_control");$?Se.clipControlEXT(Se.LOWER_LEFT_EXT,Se.ZERO_TO_ONE_EXT):Se.clipControlEXT(Se.LOWER_LEFT_EXT,Se.NEGATIVE_ONE_TO_ONE_EXT),te=$;const me=de;de=null,this.setClear(me)}},getReversed:function(){return te},setTest:function($){$?Q(e.DEPTH_TEST):Re(e.DEPTH_TEST)},setMask:function($){X!==$&&!E&&(e.depthMask($),X=$)},setFunc:function($){if(te&&($=hs[$]),oe!==$){switch($){case Qo:e.depthFunc(e.NEVER);break;case jo:e.depthFunc(e.ALWAYS);break;case Zo:e.depthFunc(e.LESS);break;case Oi:e.depthFunc(e.LEQUAL);break;case $o:e.depthFunc(e.EQUAL);break;case Ko:e.depthFunc(e.GEQUAL);break;case Yo:e.depthFunc(e.GREATER);break;case qo:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}oe=$}},setLocked:function($){E=$},setClear:function($){de!==$&&(de=$,te&&($=1-$),e.clearDepth($))},reset:function(){E=!1,X=null,oe=null,de=null,te=!1}}}function a(){let E=!1,te=null,X=null,oe=null,de=null,$=null,Se=null,me=null,tt=null;return{setTest:function(Ke){E||(Ke?Q(e.STENCIL_TEST):Re(e.STENCIL_TEST))},setMask:function(Ke){te!==Ke&&!E&&(e.stencilMask(Ke),te=Ke)},setFunc:function(Ke,Lt,wt){(X!==Ke||oe!==Lt||de!==wt)&&(e.stencilFunc(Ke,Lt,wt),X=Ke,oe=Lt,de=wt)},setOp:function(Ke,Lt,wt){($!==Ke||Se!==Lt||me!==wt)&&(e.stencilOp(Ke,Lt,wt),$=Ke,Se=Lt,me=wt)},setLocked:function(Ke){E=Ke},setClear:function(Ke){tt!==Ke&&(e.clearStencil(Ke),tt=Ke)},reset:function(){E=!1,te=null,X=null,oe=null,de=null,$=null,Se=null,me=null,tt=null}}}const o=new t,s=new i,d=new a,M=new WeakMap,g=new WeakMap;let F={},C={},h={},S=new WeakMap,R=[],B=null,u=!1,c=null,w=null,I=null,m=null,A=null,v=null,P=null,f=new Ye(0,0,0),_=0,y=!1,D=null,O=null,j=null,K=null,z=null;const q=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let V=!1,Z=0;const ee=e.getParameter(e.VERSION);ee.indexOf("WebGL")!==-1?(Z=parseFloat(/^WebGL (\d)/.exec(ee)[1]),V=Z>=1):ee.indexOf("OpenGL ES")!==-1&&(Z=parseFloat(/^OpenGL ES (\d)/.exec(ee)[1]),V=Z>=2);let ce=null,_e={};const ve=e.getParameter(e.SCISSOR_BOX),Oe=e.getParameter(e.VIEWPORT),Qe=new pt().fromArray(ve),Be=new pt().fromArray(Oe);function k(E,te,X,oe){const de=new Uint8Array(4),$=e.createTexture();e.bindTexture(E,$),e.texParameteri(E,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(E,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let Se=0;Se<X;Se++)E===e.TEXTURE_3D||E===e.TEXTURE_2D_ARRAY?e.texImage3D(te,0,e.RGBA,1,1,oe,0,e.RGBA,e.UNSIGNED_BYTE,de):e.texImage2D(te+Se,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,de);return $}const ne={};ne[e.TEXTURE_2D]=k(e.TEXTURE_2D,e.TEXTURE_2D,1),ne[e.TEXTURE_CUBE_MAP]=k(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),ne[e.TEXTURE_2D_ARRAY]=k(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),ne[e.TEXTURE_3D]=k(e.TEXTURE_3D,e.TEXTURE_3D,1,1),o.setClear(0,0,0,1),s.setClear(1),d.setClear(0),Q(e.DEPTH_TEST),s.setFunc(Oi),st(!1),ct(ma),Q(e.CULL_FACE),He(Wt);function Q(E){F[E]!==!0&&(e.enable(E),F[E]=!0)}function Re(E){F[E]!==!1&&(e.disable(E),F[E]=!1)}function Ce(E,te){return h[E]!==te?(e.bindFramebuffer(E,te),h[E]=te,E===e.DRAW_FRAMEBUFFER&&(h[e.FRAMEBUFFER]=te),E===e.FRAMEBUFFER&&(h[e.DRAW_FRAMEBUFFER]=te),!0):!1}function Ae(E,te){let X=R,oe=!1;if(E){X=S.get(te),X===void 0&&(X=[],S.set(te,X));const de=E.textures;if(X.length!==de.length||X[0]!==e.COLOR_ATTACHMENT0){for(let $=0,Se=de.length;$<Se;$++)X[$]=e.COLOR_ATTACHMENT0+$;X.length=de.length,oe=!0}}else X[0]!==e.BACK&&(X[0]=e.BACK,oe=!0);oe&&e.drawBuffers(X)}function at(E){return B!==E?(e.useProgram(E),B=E,!0):!1}const Ne={[hn]:e.FUNC_ADD,[lo]:e.FUNC_SUBTRACT,[so]:e.FUNC_REVERSE_SUBTRACT};Ne[ms]=e.MIN,Ne[_s]=e.MAX;const ke={[Ao]:e.ZERO,[To]:e.ONE,[Mo]:e.SRC_COLOR,[xo]:e.SRC_ALPHA,[Eo]:e.SRC_ALPHA_SATURATE,[So]:e.DST_COLOR,[vo]:e.DST_ALPHA,[go]:e.ONE_MINUS_SRC_COLOR,[_o]:e.ONE_MINUS_SRC_ALPHA,[mo]:e.ONE_MINUS_DST_COLOR,[ho]:e.ONE_MINUS_DST_ALPHA,[po]:e.CONSTANT_COLOR,[uo]:e.ONE_MINUS_CONSTANT_COLOR,[fo]:e.CONSTANT_ALPHA,[co]:e.ONE_MINUS_CONSTANT_ALPHA};function He(E,te,X,oe,de,$,Se,me,tt,Ke){if(E===Wt){u===!0&&(Re(e.BLEND),u=!1);return}if(u===!1&&(Q(e.BLEND),u=!0),E!==ts){if(E!==c||Ke!==y){if((w!==hn||A!==hn)&&(e.blendEquation(e.FUNC_ADD),w=hn,A=hn),Ke)switch(E){case Fn:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case va:e.blendFunc(e.ONE,e.ONE);break;case ga:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case _a:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:je("WebGLState: Invalid blending: ",E);break}else switch(E){case Fn:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case va:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case ga:je("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case _a:je("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:je("WebGLState: Invalid blending: ",E);break}I=null,m=null,v=null,P=null,f.set(0,0,0),_=0,c=E,y=Ke}return}de=de||te,$=$||X,Se=Se||oe,(te!==w||de!==A)&&(e.blendEquationSeparate(Ne[te],Ne[de]),w=te,A=de),(X!==I||oe!==m||$!==v||Se!==P)&&(e.blendFuncSeparate(ke[X],ke[oe],ke[$],ke[Se]),I=X,m=oe,v=$,P=Se),(me.equals(f)===!1||tt!==_)&&(e.blendColor(me.r,me.g,me.b,tt),f.copy(me),_=tt),c=E,y=!1}function Fe(E,te){E.side===Ft?Re(e.CULL_FACE):Q(e.CULL_FACE);let X=E.side===At;te&&(X=!X),st(X),E.blending===Fn&&E.transparent===!1?He(Wt):He(E.blending,E.blendEquation,E.blendSrc,E.blendDst,E.blendEquationAlpha,E.blendSrcAlpha,E.blendDstAlpha,E.blendColor,E.blendAlpha,E.premultipliedAlpha),s.setFunc(E.depthFunc),s.setTest(E.depthTest),s.setMask(E.depthWrite),o.setMask(E.colorWrite);const oe=E.stencilWrite;d.setTest(oe),oe&&(d.setMask(E.stencilWriteMask),d.setFunc(E.stencilFunc,E.stencilRef,E.stencilFuncMask),d.setOp(E.stencilFail,E.stencilZFail,E.stencilZPass)),ht(E.polygonOffset,E.polygonOffsetFactor,E.polygonOffsetUnits),E.alphaToCoverage===!0?Q(e.SAMPLE_ALPHA_TO_COVERAGE):Re(e.SAMPLE_ALPHA_TO_COVERAGE)}function st(E){D!==E&&(E?e.frontFace(e.CW):e.frontFace(e.CCW),D=E)}function ct(E){E!==Jo?(Q(e.CULL_FACE),E!==O&&(E===ma?e.cullFace(e.BACK):E===es?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))):Re(e.CULL_FACE),O=E}function dt(E){E!==j&&(V&&e.lineWidth(E),j=E)}function ht(E,te,X){E?(Q(e.POLYGON_OFFSET_FILL),(K!==te||z!==X)&&(K=te,z=X,s.getReversed()&&(te=-te),e.polygonOffset(te,X))):Re(e.POLYGON_OFFSET_FILL)}function et(E){E?Q(e.SCISSOR_TEST):Re(e.SCISSOR_TEST)}function lt(E){E===void 0&&(E=e.TEXTURE0+q-1),ce!==E&&(e.activeTexture(E),ce=E)}function x(E,te,X){X===void 0&&(ce===null?X=e.TEXTURE0+q-1:X=ce);let oe=_e[X];oe===void 0&&(oe={type:void 0,texture:void 0},_e[X]=oe),(oe.type!==E||oe.texture!==te)&&(ce!==X&&(e.activeTexture(X),ce=X),e.bindTexture(E,te||ne[E]),oe.type=E,oe.texture=te)}function Et(){const E=_e[ce];E!==void 0&&E.type!==void 0&&(e.bindTexture(E.type,null),E.type=void 0,E.texture=void 0)}function We(){try{e.compressedTexImage2D(...arguments)}catch(E){je("WebGLState:",E)}}function p(){try{e.compressedTexImage3D(...arguments)}catch(E){je("WebGLState:",E)}}function r(){try{e.texSubImage2D(...arguments)}catch(E){je("WebGLState:",E)}}function b(){try{e.texSubImage3D(...arguments)}catch(E){je("WebGLState:",E)}}function N(){try{e.compressedTexSubImage2D(...arguments)}catch(E){je("WebGLState:",E)}}function H(){try{e.compressedTexSubImage3D(...arguments)}catch(E){je("WebGLState:",E)}}function J(){try{e.texStorage2D(...arguments)}catch(E){je("WebGLState:",E)}}function ie(){try{e.texStorage3D(...arguments)}catch(E){je("WebGLState:",E)}}function W(){try{e.texImage2D(...arguments)}catch(E){je("WebGLState:",E)}}function Y(){try{e.texImage3D(...arguments)}catch(E){je("WebGLState:",E)}}function ae(E){return C[E]!==void 0?C[E]:e.getParameter(E)}function Ee(E,te){C[E]!==te&&(e.pixelStorei(E,te),C[E]=te)}function se(E){Qe.equals(E)===!1&&(e.scissor(E.x,E.y,E.z,E.w),Qe.copy(E))}function re(E){Be.equals(E)===!1&&(e.viewport(E.x,E.y,E.z,E.w),Be.copy(E))}function Te(E,te){let X=g.get(te);X===void 0&&(X=new WeakMap,g.set(te,X));let oe=X.get(E);oe===void 0&&(oe=e.getUniformBlockIndex(te,E.name),X.set(E,oe))}function be(E,te){const oe=g.get(te).get(E);M.get(te)!==oe&&(e.uniformBlockBinding(te,oe,E.__bindingPointIndex),M.set(te,oe))}function De(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),s.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),F={},C={},ce=null,_e={},h={},S=new WeakMap,R=[],B=null,u=!1,c=null,w=null,I=null,m=null,A=null,v=null,P=null,f=new Ye(0,0,0),_=0,y=!1,D=null,O=null,j=null,K=null,z=null,Qe.set(0,0,e.canvas.width,e.canvas.height),Be.set(0,0,e.canvas.width,e.canvas.height),o.reset(),s.reset(),d.reset()}return{buffers:{color:o,depth:s,stencil:d},enable:Q,disable:Re,bindFramebuffer:Ce,drawBuffers:Ae,useProgram:at,setBlending:He,setMaterial:Fe,setFlipSided:st,setCullFace:ct,setLineWidth:dt,setPolygonOffset:ht,setScissorTest:et,activeTexture:lt,bindTexture:x,unbindTexture:Et,compressedTexImage2D:We,compressedTexImage3D:p,texImage2D:W,texImage3D:Y,pixelStorei:Ee,getParameter:ae,updateUBOMapping:Te,uniformBlockBinding:be,texStorage2D:J,texStorage3D:ie,texSubImage2D:r,texSubImage3D:b,compressedTexSubImage2D:N,compressedTexSubImage3D:H,scissor:se,viewport:re,reset:De}}function fd(e,n,t,i,a,o,s){const d=n.has("WEBGL_multisampled_render_to_texture")?n.get("WEBGL_multisampled_render_to_texture"):null,M=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),g=new it,F=new WeakMap,C=new Set;let h;const S=new WeakMap;let R=!1;try{R=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function B(p,r){return R?new OffscreenCanvas(p,r):cs("canvas")}function u(p,r,b){let N=1;const H=We(p);if((H.width>b||H.height>b)&&(N=b/Math.max(H.width,H.height)),N<1)if(typeof HTMLImageElement<"u"&&p instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&p instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&p instanceof ImageBitmap||typeof VideoFrame<"u"&&p instanceof VideoFrame){const J=Math.floor(N*H.width),ie=Math.floor(N*H.height);h===void 0&&(h=B(J,ie));const W=r?B(J,ie):h;return W.width=J,W.height=ie,W.getContext("2d").drawImage(p,0,0,J,ie),Ve("WebGLRenderer: Texture has been resized from ("+H.width+"x"+H.height+") to ("+J+"x"+ie+")."),W}else return"data"in p&&Ve("WebGLRenderer: Image in DataTexture is too big ("+H.width+"x"+H.height+")."),p;return p}function c(p){return p.generateMipmaps}function w(p){e.generateMipmap(p)}function I(p){return p.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:p.isWebGL3DRenderTarget?e.TEXTURE_3D:p.isWebGLArrayRenderTarget||p.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function m(p,r,b,N,H,J=!1){if(p!==null){if(e[p]!==void 0)return e[p];Ve("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+p+"'")}let ie;N&&(ie=n.get("EXT_texture_norm16"),ie||Ve("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let W=r;if(r===e.RED&&(b===e.FLOAT&&(W=e.R32F),b===e.HALF_FLOAT&&(W=e.R16F),b===e.UNSIGNED_BYTE&&(W=e.R8),b===e.UNSIGNED_SHORT&&ie&&(W=ie.R16_EXT),b===e.SHORT&&ie&&(W=ie.R16_SNORM_EXT)),r===e.RED_INTEGER&&(b===e.UNSIGNED_BYTE&&(W=e.R8UI),b===e.UNSIGNED_SHORT&&(W=e.R16UI),b===e.UNSIGNED_INT&&(W=e.R32UI),b===e.BYTE&&(W=e.R8I),b===e.SHORT&&(W=e.R16I),b===e.INT&&(W=e.R32I)),r===e.RG&&(b===e.FLOAT&&(W=e.RG32F),b===e.HALF_FLOAT&&(W=e.RG16F),b===e.UNSIGNED_BYTE&&(W=e.RG8),b===e.UNSIGNED_SHORT&&ie&&(W=ie.RG16_EXT),b===e.SHORT&&ie&&(W=ie.RG16_SNORM_EXT)),r===e.RG_INTEGER&&(b===e.UNSIGNED_BYTE&&(W=e.RG8UI),b===e.UNSIGNED_SHORT&&(W=e.RG16UI),b===e.UNSIGNED_INT&&(W=e.RG32UI),b===e.BYTE&&(W=e.RG8I),b===e.SHORT&&(W=e.RG16I),b===e.INT&&(W=e.RG32I)),r===e.RGB_INTEGER&&(b===e.UNSIGNED_BYTE&&(W=e.RGB8UI),b===e.UNSIGNED_SHORT&&(W=e.RGB16UI),b===e.UNSIGNED_INT&&(W=e.RGB32UI),b===e.BYTE&&(W=e.RGB8I),b===e.SHORT&&(W=e.RGB16I),b===e.INT&&(W=e.RGB32I)),r===e.RGBA_INTEGER&&(b===e.UNSIGNED_BYTE&&(W=e.RGBA8UI),b===e.UNSIGNED_SHORT&&(W=e.RGBA16UI),b===e.UNSIGNED_INT&&(W=e.RGBA32UI),b===e.BYTE&&(W=e.RGBA8I),b===e.SHORT&&(W=e.RGBA16I),b===e.INT&&(W=e.RGBA32I)),r===e.RGB&&(b===e.UNSIGNED_SHORT&&ie&&(W=ie.RGB16_EXT),b===e.SHORT&&ie&&(W=ie.RGB16_SNORM_EXT),b===e.UNSIGNED_INT_5_9_9_9_REV&&(W=e.RGB9_E5),b===e.UNSIGNED_INT_10F_11F_11F_REV&&(W=e.R11F_G11F_B10F)),r===e.RGBA){const Y=J?wr:Je.getTransfer(H);b===e.FLOAT&&(W=e.RGBA32F),b===e.HALF_FLOAT&&(W=e.RGBA16F),b===e.UNSIGNED_BYTE&&(W=Y===Ze?e.SRGB8_ALPHA8:e.RGBA8),b===e.UNSIGNED_SHORT&&ie&&(W=ie.RGBA16_EXT),b===e.SHORT&&ie&&(W=ie.RGBA16_SNORM_EXT),b===e.UNSIGNED_SHORT_4_4_4_4&&(W=e.RGBA4),b===e.UNSIGNED_SHORT_5_5_5_1&&(W=e.RGB5_A1)}return(W===e.R16F||W===e.R32F||W===e.RG16F||W===e.RG32F||W===e.RGBA16F||W===e.RGBA32F)&&n.get("EXT_color_buffer_float"),W}function A(p,r){let b;return p?r===null||r===nn||r===Mn?b=e.DEPTH24_STENCIL8:r===Kt?b=e.DEPTH32F_STENCIL8:r===On&&(b=e.DEPTH24_STENCIL8,Ve("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):r===null||r===nn||r===Mn?b=e.DEPTH_COMPONENT24:r===Kt?b=e.DEPTH_COMPONENT32F:r===On&&(b=e.DEPTH_COMPONENT16),b}function v(p,r){return c(p)===!0||p.isFramebufferTexture&&p.minFilter!==Jt&&p.minFilter!==_t?Math.log2(Math.max(r.width,r.height))+1:p.mipmaps!==void 0&&p.mipmaps.length>0?p.mipmaps.length:p.isCompressedTexture&&Array.isArray(p.image)?r.mipmaps.length:1}function P(p){const r=p.target;r.removeEventListener("dispose",P),_(r),r.isVideoTexture&&F.delete(r),r.isHTMLTexture&&C.delete(r)}function f(p){const r=p.target;r.removeEventListener("dispose",f),D(r)}function _(p){const r=i.get(p);if(r.__webglInit===void 0)return;const b=p.source,N=S.get(b);if(N){const H=N[r.__cacheKey];H.usedTimes--,H.usedTimes===0&&y(p),Object.keys(N).length===0&&S.delete(b)}i.remove(p)}function y(p){const r=i.get(p);e.deleteTexture(r.__webglTexture);const b=p.source,N=S.get(b);delete N[r.__cacheKey],s.memory.textures--}function D(p){const r=i.get(p);if(p.depthTexture&&(p.depthTexture.dispose(),i.remove(p.depthTexture)),p.isWebGLCubeRenderTarget)for(let N=0;N<6;N++){if(Array.isArray(r.__webglFramebuffer[N]))for(let H=0;H<r.__webglFramebuffer[N].length;H++)e.deleteFramebuffer(r.__webglFramebuffer[N][H]);else e.deleteFramebuffer(r.__webglFramebuffer[N]);r.__webglDepthbuffer&&e.deleteRenderbuffer(r.__webglDepthbuffer[N])}else{if(Array.isArray(r.__webglFramebuffer))for(let N=0;N<r.__webglFramebuffer.length;N++)e.deleteFramebuffer(r.__webglFramebuffer[N]);else e.deleteFramebuffer(r.__webglFramebuffer);if(r.__webglDepthbuffer&&e.deleteRenderbuffer(r.__webglDepthbuffer),r.__webglMultisampledFramebuffer&&e.deleteFramebuffer(r.__webglMultisampledFramebuffer),r.__webglColorRenderbuffer)for(let N=0;N<r.__webglColorRenderbuffer.length;N++)r.__webglColorRenderbuffer[N]&&e.deleteRenderbuffer(r.__webglColorRenderbuffer[N]);r.__webglDepthRenderbuffer&&e.deleteRenderbuffer(r.__webglDepthRenderbuffer)}const b=p.textures;for(let N=0,H=b.length;N<H;N++){const J=i.get(b[N]);J.__webglTexture&&(e.deleteTexture(J.__webglTexture),s.memory.textures--),i.remove(b[N])}i.remove(p)}let O=0;function j(){O=0}function K(){return O}function z(p){O=p}function q(){const p=O;return p>=a.maxTextures&&Ve("WebGLTextures: Trying to use "+p+" texture units while this GPU supports only "+a.maxTextures),O+=1,p}function V(p){const r=[];return r.push(p.wrapS),r.push(p.wrapT),r.push(p.wrapR||0),r.push(p.magFilter),r.push(p.minFilter),r.push(p.anisotropy),r.push(p.internalFormat),r.push(p.format),r.push(p.type),r.push(p.generateMipmaps),r.push(p.premultiplyAlpha),r.push(p.flipY),r.push(p.unpackAlignment),r.push(p.colorSpace),r.join()}function Z(p,r){const b=i.get(p);if(p.isVideoTexture&&x(p),p.isRenderTargetTexture===!1&&p.isExternalTexture!==!0&&p.version>0&&b.__version!==p.version){const N=p.image;if(N===null)Ve("WebGLRenderer: Texture marked for update but no image data found.");else if(N.complete===!1)Ve("WebGLRenderer: Texture marked for update but image is incomplete");else{Re(b,p,r);return}}else p.isExternalTexture&&(b.__webglTexture=p.sourceTexture?p.sourceTexture:null);t.bindTexture(e.TEXTURE_2D,b.__webglTexture,e.TEXTURE0+r)}function ee(p,r){const b=i.get(p);if(p.isRenderTargetTexture===!1&&p.version>0&&b.__version!==p.version){Re(b,p,r);return}else p.isExternalTexture&&(b.__webglTexture=p.sourceTexture?p.sourceTexture:null);t.bindTexture(e.TEXTURE_2D_ARRAY,b.__webglTexture,e.TEXTURE0+r)}function ce(p,r){const b=i.get(p);if(p.isRenderTargetTexture===!1&&p.version>0&&b.__version!==p.version){Re(b,p,r);return}t.bindTexture(e.TEXTURE_3D,b.__webglTexture,e.TEXTURE0+r)}function _e(p,r){const b=i.get(p);if(p.isCubeDepthTexture!==!0&&p.version>0&&b.__version!==p.version){Ce(b,p,r);return}t.bindTexture(e.TEXTURE_CUBE_MAP,b.__webglTexture,e.TEXTURE0+r)}const ve={[mi]:e.REPEAT,[Tn]:e.CLAMP_TO_EDGE,[bo]:e.MIRRORED_REPEAT},Oe={[Jt]:e.NEAREST,[Ro]:e.NEAREST_MIPMAP_NEAREST,[Dn]:e.NEAREST_MIPMAP_LINEAR,[_t]:e.LINEAR,[Yn]:e.LINEAR_MIPMAP_NEAREST,[ln]:e.LINEAR_MIPMAP_LINEAR},Qe={[Uo]:e.NEVER,[wo]:e.ALWAYS,[Lo]:e.LESS,[Ai]:e.LEQUAL,[Po]:e.EQUAL,[Ti]:e.GEQUAL,[Do]:e.GREATER,[Co]:e.NOTEQUAL};function Be(p,r){if(r.type===Kt&&n.has("OES_texture_float_linear")===!1&&(r.magFilter===_t||r.magFilter===Yn||r.magFilter===Dn||r.magFilter===ln||r.minFilter===_t||r.minFilter===Yn||r.minFilter===Dn||r.minFilter===ln)&&Ve("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),e.texParameteri(p,e.TEXTURE_WRAP_S,ve[r.wrapS]),e.texParameteri(p,e.TEXTURE_WRAP_T,ve[r.wrapT]),(p===e.TEXTURE_3D||p===e.TEXTURE_2D_ARRAY)&&e.texParameteri(p,e.TEXTURE_WRAP_R,ve[r.wrapR]),e.texParameteri(p,e.TEXTURE_MAG_FILTER,Oe[r.magFilter]),e.texParameteri(p,e.TEXTURE_MIN_FILTER,Oe[r.minFilter]),r.compareFunction&&(e.texParameteri(p,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(p,e.TEXTURE_COMPARE_FUNC,Qe[r.compareFunction])),n.has("EXT_texture_filter_anisotropic")===!0){if(r.magFilter===Jt||r.minFilter!==Dn&&r.minFilter!==ln||r.type===Kt&&n.has("OES_texture_float_linear")===!1)return;if(r.anisotropy>1||i.get(r).__currentAnisotropy){const b=n.get("EXT_texture_filter_anisotropic");e.texParameterf(p,b.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(r.anisotropy,a.getMaxAnisotropy())),i.get(r).__currentAnisotropy=r.anisotropy}}}function k(p,r){let b=!1;p.__webglInit===void 0&&(p.__webglInit=!0,r.addEventListener("dispose",P));const N=r.source;let H=S.get(N);H===void 0&&(H={},S.set(N,H));const J=V(r);if(J!==p.__cacheKey){H[J]===void 0&&(H[J]={texture:e.createTexture(),usedTimes:0},s.memory.textures++,b=!0),H[J].usedTimes++;const ie=H[p.__cacheKey];ie!==void 0&&(H[p.__cacheKey].usedTimes--,ie.usedTimes===0&&y(r)),p.__cacheKey=J,p.__webglTexture=H[J].texture}return b}function ne(p,r,b){return Math.floor(Math.floor(p/b)/r)}function Q(p,r,b,N){const J=p.updateRanges;if(J.length===0)t.texSubImage2D(e.TEXTURE_2D,0,0,0,r.width,r.height,b,N,r.data);else{J.sort((Ee,se)=>Ee.start-se.start);let ie=0;for(let Ee=1;Ee<J.length;Ee++){const se=J[ie],re=J[Ee],Te=se.start+se.count,be=ne(re.start,r.width,4),De=ne(se.start,r.width,4);re.start<=Te+1&&be===De&&ne(re.start+re.count-1,r.width,4)===be?se.count=Math.max(se.count,re.start+re.count-se.start):(++ie,J[ie]=re)}J.length=ie+1;const W=t.getParameter(e.UNPACK_ROW_LENGTH),Y=t.getParameter(e.UNPACK_SKIP_PIXELS),ae=t.getParameter(e.UNPACK_SKIP_ROWS);t.pixelStorei(e.UNPACK_ROW_LENGTH,r.width);for(let Ee=0,se=J.length;Ee<se;Ee++){const re=J[Ee],Te=Math.floor(re.start/4),be=Math.ceil(re.count/4),De=Te%r.width,E=Math.floor(Te/r.width),te=be,X=1;t.pixelStorei(e.UNPACK_SKIP_PIXELS,De),t.pixelStorei(e.UNPACK_SKIP_ROWS,E),t.texSubImage2D(e.TEXTURE_2D,0,De,E,te,X,b,N,r.data)}p.clearUpdateRanges(),t.pixelStorei(e.UNPACK_ROW_LENGTH,W),t.pixelStorei(e.UNPACK_SKIP_PIXELS,Y),t.pixelStorei(e.UNPACK_SKIP_ROWS,ae)}}function Re(p,r,b){let N=e.TEXTURE_2D;(r.isDataArrayTexture||r.isCompressedArrayTexture)&&(N=e.TEXTURE_2D_ARRAY),r.isData3DTexture&&(N=e.TEXTURE_3D);const H=k(p,r),J=r.source;t.bindTexture(N,p.__webglTexture,e.TEXTURE0+b);const ie=i.get(J);if(J.version!==ie.__version||H===!0){if(t.activeTexture(e.TEXTURE0+b),(typeof ImageBitmap<"u"&&r.image instanceof ImageBitmap)===!1){const X=Je.getPrimaries(Je.workingColorSpace),oe=r.colorSpace===Yt?null:Je.getPrimaries(r.colorSpace),de=r.colorSpace===Yt||X===oe?e.NONE:e.BROWSER_DEFAULT_WEBGL;t.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,r.flipY),t.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,r.premultiplyAlpha),t.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,de)}t.pixelStorei(e.UNPACK_ALIGNMENT,r.unpackAlignment);let Y=u(r.image,!1,a.maxTextureSize);Y=Et(r,Y);const ae=o.convert(r.format,r.colorSpace),Ee=o.convert(r.type);let se=m(r.internalFormat,ae,Ee,r.normalized,r.colorSpace,r.isVideoTexture);Be(N,r);let re;const Te=r.mipmaps,be=r.isVideoTexture!==!0,De=ie.__version===void 0||H===!0,E=J.dataReady,te=v(r,Y);if(r.isDepthTexture)se=A(r.format===cn,r.type),De&&(be?t.texStorage2D(e.TEXTURE_2D,1,se,Y.width,Y.height):t.texImage2D(e.TEXTURE_2D,0,se,Y.width,Y.height,0,ae,Ee,null));else if(r.isDataTexture)if(Te.length>0){be&&De&&t.texStorage2D(e.TEXTURE_2D,te,se,Te[0].width,Te[0].height);for(let X=0,oe=Te.length;X<oe;X++)re=Te[X],be?E&&t.texSubImage2D(e.TEXTURE_2D,X,0,0,re.width,re.height,ae,Ee,re.data):t.texImage2D(e.TEXTURE_2D,X,se,re.width,re.height,0,ae,Ee,re.data);r.generateMipmaps=!1}else be?(De&&t.texStorage2D(e.TEXTURE_2D,te,se,Y.width,Y.height),E&&Q(r,Y,ae,Ee)):t.texImage2D(e.TEXTURE_2D,0,se,Y.width,Y.height,0,ae,Ee,Y.data);else if(r.isCompressedTexture)if(r.isCompressedArrayTexture){be&&De&&t.texStorage3D(e.TEXTURE_2D_ARRAY,te,se,Te[0].width,Te[0].height,Y.depth);for(let X=0,oe=Te.length;X<oe;X++)if(re=Te[X],r.format!==Gt)if(ae!==null)if(be){if(E)if(r.layerUpdates.size>0){const de=Ea(re.width,re.height,r.format,r.type);for(const $ of r.layerUpdates){const Se=re.data.subarray($*de/re.data.BYTES_PER_ELEMENT,($+1)*de/re.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,X,0,0,$,re.width,re.height,1,ae,Se)}r.clearLayerUpdates()}else t.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,X,0,0,0,re.width,re.height,Y.depth,ae,re.data)}else t.compressedTexImage3D(e.TEXTURE_2D_ARRAY,X,se,re.width,re.height,Y.depth,0,re.data,0,0);else Ve("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else be?E&&t.texSubImage3D(e.TEXTURE_2D_ARRAY,X,0,0,0,re.width,re.height,Y.depth,ae,Ee,re.data):t.texImage3D(e.TEXTURE_2D_ARRAY,X,se,re.width,re.height,Y.depth,0,ae,Ee,re.data)}else{be&&De&&t.texStorage2D(e.TEXTURE_2D,te,se,Te[0].width,Te[0].height);for(let X=0,oe=Te.length;X<oe;X++)re=Te[X],r.format!==Gt?ae!==null?be?E&&t.compressedTexSubImage2D(e.TEXTURE_2D,X,0,0,re.width,re.height,ae,re.data):t.compressedTexImage2D(e.TEXTURE_2D,X,se,re.width,re.height,0,re.data):Ve("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):be?E&&t.texSubImage2D(e.TEXTURE_2D,X,0,0,re.width,re.height,ae,Ee,re.data):t.texImage2D(e.TEXTURE_2D,X,se,re.width,re.height,0,ae,Ee,re.data)}else if(r.isDataArrayTexture)if(be){if(De&&t.texStorage3D(e.TEXTURE_2D_ARRAY,te,se,Y.width,Y.height,Y.depth),E)if(r.layerUpdates.size>0){const X=Ea(Y.width,Y.height,r.format,r.type);for(const oe of r.layerUpdates){const de=Y.data.subarray(oe*X/Y.data.BYTES_PER_ELEMENT,(oe+1)*X/Y.data.BYTES_PER_ELEMENT);t.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,oe,Y.width,Y.height,1,ae,Ee,de)}r.clearLayerUpdates()}else t.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,Y.width,Y.height,Y.depth,ae,Ee,Y.data)}else t.texImage3D(e.TEXTURE_2D_ARRAY,0,se,Y.width,Y.height,Y.depth,0,ae,Ee,Y.data);else if(r.isData3DTexture)be?(De&&t.texStorage3D(e.TEXTURE_3D,te,se,Y.width,Y.height,Y.depth),E&&t.texSubImage3D(e.TEXTURE_3D,0,0,0,0,Y.width,Y.height,Y.depth,ae,Ee,Y.data)):t.texImage3D(e.TEXTURE_3D,0,se,Y.width,Y.height,Y.depth,0,ae,Ee,Y.data);else if(r.isFramebufferTexture){if(De)if(be)t.texStorage2D(e.TEXTURE_2D,te,se,Y.width,Y.height);else{let X=Y.width,oe=Y.height;for(let de=0;de<te;de++)t.texImage2D(e.TEXTURE_2D,de,se,X,oe,0,ae,Ee,null),X>>=1,oe>>=1}}else if(r.isHTMLTexture){if("texElementImage2D"in e){const X=e.canvas;if(X.hasAttribute("layoutsubtree")||X.setAttribute("layoutsubtree","true"),Y.parentNode!==X){X.appendChild(Y),C.add(r),X.onpaint=oe=>{const de=oe.changedElements;for(const $ of C)de.includes($.image)&&($.needsUpdate=!0)},X.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,Y);else{const de=e.RGBA,$=e.RGBA,Se=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,de,$,Se,Y)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(Te.length>0){if(be&&De){const X=We(Te[0]);t.texStorage2D(e.TEXTURE_2D,te,se,X.width,X.height)}for(let X=0,oe=Te.length;X<oe;X++)re=Te[X],be?E&&t.texSubImage2D(e.TEXTURE_2D,X,0,0,ae,Ee,re):t.texImage2D(e.TEXTURE_2D,X,se,ae,Ee,re);r.generateMipmaps=!1}else if(be){if(De){const X=We(Y);t.texStorage2D(e.TEXTURE_2D,te,se,X.width,X.height)}E&&t.texSubImage2D(e.TEXTURE_2D,0,0,0,ae,Ee,Y)}else t.texImage2D(e.TEXTURE_2D,0,se,ae,Ee,Y);c(r)&&w(N),ie.__version=J.version,r.onUpdate&&r.onUpdate(r)}p.__version=r.version}function Ce(p,r,b){if(r.image.length!==6)return;const N=k(p,r),H=r.source;t.bindTexture(e.TEXTURE_CUBE_MAP,p.__webglTexture,e.TEXTURE0+b);const J=i.get(H);if(H.version!==J.__version||N===!0){t.activeTexture(e.TEXTURE0+b);const ie=Je.getPrimaries(Je.workingColorSpace),W=r.colorSpace===Yt?null:Je.getPrimaries(r.colorSpace),Y=r.colorSpace===Yt||ie===W?e.NONE:e.BROWSER_DEFAULT_WEBGL;t.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,r.flipY),t.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,r.premultiplyAlpha),t.pixelStorei(e.UNPACK_ALIGNMENT,r.unpackAlignment),t.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,Y);const ae=r.isCompressedTexture||r.image[0].isCompressedTexture,Ee=r.image[0]&&r.image[0].isDataTexture,se=[];for(let $=0;$<6;$++)!ae&&!Ee?se[$]=u(r.image[$],!0,a.maxCubemapSize):se[$]=Ee?r.image[$].image:r.image[$],se[$]=Et(r,se[$]);const re=se[0],Te=o.convert(r.format,r.colorSpace),be=o.convert(r.type),De=m(r.internalFormat,Te,be,r.normalized,r.colorSpace),E=r.isVideoTexture!==!0,te=J.__version===void 0||N===!0,X=H.dataReady;let oe=v(r,re);Be(e.TEXTURE_CUBE_MAP,r);let de;if(ae){E&&te&&t.texStorage2D(e.TEXTURE_CUBE_MAP,oe,De,re.width,re.height);for(let $=0;$<6;$++){de=se[$].mipmaps;for(let Se=0;Se<de.length;Se++){const me=de[Se];r.format!==Gt?Te!==null?E?X&&t.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,Se,0,0,me.width,me.height,Te,me.data):t.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,Se,De,me.width,me.height,0,me.data):Ve("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):E?X&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,Se,0,0,me.width,me.height,Te,be,me.data):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,Se,De,me.width,me.height,0,Te,be,me.data)}}}else{if(de=r.mipmaps,E&&te){de.length>0&&oe++;const $=We(se[0]);t.texStorage2D(e.TEXTURE_CUBE_MAP,oe,De,$.width,$.height)}for(let $=0;$<6;$++)if(Ee){E?X&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,0,0,se[$].width,se[$].height,Te,be,se[$].data):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,De,se[$].width,se[$].height,0,Te,be,se[$].data);for(let Se=0;Se<de.length;Se++){const tt=de[Se].image[$].image;E?X&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,Se+1,0,0,tt.width,tt.height,Te,be,tt.data):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,Se+1,De,tt.width,tt.height,0,Te,be,tt.data)}}else{E?X&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,0,0,Te,be,se[$]):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,De,Te,be,se[$]);for(let Se=0;Se<de.length;Se++){const me=de[Se];E?X&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,Se+1,0,0,Te,be,me.image[$]):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,Se+1,De,Te,be,me.image[$])}}}c(r)&&w(e.TEXTURE_CUBE_MAP),J.__version=H.version,r.onUpdate&&r.onUpdate(r)}p.__version=r.version}function Ae(p,r,b,N,H,J){const ie=o.convert(b.format,b.colorSpace),W=o.convert(b.type),Y=m(b.internalFormat,ie,W,b.normalized,b.colorSpace),ae=i.get(r),Ee=i.get(b);if(Ee.__renderTarget=r,!ae.__hasExternalTextures){const se=Math.max(1,r.width>>J),re=Math.max(1,r.height>>J);H===e.TEXTURE_3D||H===e.TEXTURE_2D_ARRAY?t.texImage3D(H,J,Y,se,re,r.depth,0,ie,W,null):t.texImage2D(H,J,Y,se,re,0,ie,W,null)}t.bindFramebuffer(e.FRAMEBUFFER,p),lt(r)?d.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,N,H,Ee.__webglTexture,0,et(r)):(H===e.TEXTURE_2D||H>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&H<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,N,H,Ee.__webglTexture,J),t.bindFramebuffer(e.FRAMEBUFFER,null)}function at(p,r,b){if(e.bindRenderbuffer(e.RENDERBUFFER,p),r.depthBuffer){const N=r.depthTexture,H=N&&N.isDepthTexture?N.type:null,J=A(r.stencilBuffer,H),ie=r.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;lt(r)?d.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,et(r),J,r.width,r.height):b?e.renderbufferStorageMultisample(e.RENDERBUFFER,et(r),J,r.width,r.height):e.renderbufferStorage(e.RENDERBUFFER,J,r.width,r.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,ie,e.RENDERBUFFER,p)}else{const N=r.textures;for(let H=0;H<N.length;H++){const J=N[H],ie=o.convert(J.format,J.colorSpace),W=o.convert(J.type),Y=m(J.internalFormat,ie,W,J.normalized,J.colorSpace);lt(r)?d.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,et(r),Y,r.width,r.height):b?e.renderbufferStorageMultisample(e.RENDERBUFFER,et(r),Y,r.width,r.height):e.renderbufferStorage(e.RENDERBUFFER,Y,r.width,r.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Ne(p,r,b){const N=r.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(e.FRAMEBUFFER,p),!(r.depthTexture&&r.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const H=i.get(r.depthTexture);if(H.__renderTarget=r,(!H.__webglTexture||r.depthTexture.image.width!==r.width||r.depthTexture.image.height!==r.height)&&(r.depthTexture.image.width=r.width,r.depthTexture.image.height=r.height,r.depthTexture.needsUpdate=!0),N){if(H.__webglInit===void 0&&(H.__webglInit=!0,r.depthTexture.addEventListener("dispose",P)),H.__webglTexture===void 0){H.__webglTexture=e.createTexture(),t.bindTexture(e.TEXTURE_CUBE_MAP,H.__webglTexture),Be(e.TEXTURE_CUBE_MAP,r.depthTexture);const ae=o.convert(r.depthTexture.format),Ee=o.convert(r.depthTexture.type);let se;r.depthTexture.format===un?se=e.DEPTH_COMPONENT24:r.depthTexture.format===cn&&(se=e.DEPTH24_STENCIL8);for(let re=0;re<6;re++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+re,0,se,r.width,r.height,0,ae,Ee,null)}}else Z(r.depthTexture,0);const J=H.__webglTexture,ie=et(r),W=N?e.TEXTURE_CUBE_MAP_POSITIVE_X+b:e.TEXTURE_2D,Y=r.depthTexture.format===cn?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(r.depthTexture.format===un)lt(r)?d.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,Y,W,J,0,ie):e.framebufferTexture2D(e.FRAMEBUFFER,Y,W,J,0);else if(r.depthTexture.format===cn)lt(r)?d.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,Y,W,J,0,ie):e.framebufferTexture2D(e.FRAMEBUFFER,Y,W,J,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function ke(p){const r=i.get(p),b=p.isWebGLCubeRenderTarget===!0;if(r.__boundDepthTexture!==p.depthTexture){const N=p.depthTexture;if(r.__depthDisposeCallback&&r.__depthDisposeCallback(),N){const H=()=>{delete r.__boundDepthTexture,delete r.__depthDisposeCallback,N.removeEventListener("dispose",H)};N.addEventListener("dispose",H),r.__depthDisposeCallback=H}r.__boundDepthTexture=N}if(p.depthTexture&&!r.__autoAllocateDepthBuffer)if(b)for(let N=0;N<6;N++)Ne(r.__webglFramebuffer[N],p,N);else{const N=p.texture.mipmaps;N&&N.length>0?Ne(r.__webglFramebuffer[0],p,0):Ne(r.__webglFramebuffer,p,0)}else if(b){r.__webglDepthbuffer=[];for(let N=0;N<6;N++)if(t.bindFramebuffer(e.FRAMEBUFFER,r.__webglFramebuffer[N]),r.__webglDepthbuffer[N]===void 0)r.__webglDepthbuffer[N]=e.createRenderbuffer(),at(r.__webglDepthbuffer[N],p,!1);else{const H=p.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,J=r.__webglDepthbuffer[N];e.bindRenderbuffer(e.RENDERBUFFER,J),e.framebufferRenderbuffer(e.FRAMEBUFFER,H,e.RENDERBUFFER,J)}}else{const N=p.texture.mipmaps;if(N&&N.length>0?t.bindFramebuffer(e.FRAMEBUFFER,r.__webglFramebuffer[0]):t.bindFramebuffer(e.FRAMEBUFFER,r.__webglFramebuffer),r.__webglDepthbuffer===void 0)r.__webglDepthbuffer=e.createRenderbuffer(),at(r.__webglDepthbuffer,p,!1);else{const H=p.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,J=r.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,J),e.framebufferRenderbuffer(e.FRAMEBUFFER,H,e.RENDERBUFFER,J)}}t.bindFramebuffer(e.FRAMEBUFFER,null)}function He(p,r,b){const N=i.get(p);r!==void 0&&Ae(N.__webglFramebuffer,p,p.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),b!==void 0&&ke(p)}function Fe(p){const r=p.texture,b=i.get(p),N=i.get(r);p.addEventListener("dispose",f);const H=p.textures,J=p.isWebGLCubeRenderTarget===!0,ie=H.length>1;if(ie||(N.__webglTexture===void 0&&(N.__webglTexture=e.createTexture()),N.__version=r.version,s.memory.textures++),J){b.__webglFramebuffer=[];for(let W=0;W<6;W++)if(r.mipmaps&&r.mipmaps.length>0){b.__webglFramebuffer[W]=[];for(let Y=0;Y<r.mipmaps.length;Y++)b.__webglFramebuffer[W][Y]=e.createFramebuffer()}else b.__webglFramebuffer[W]=e.createFramebuffer()}else{if(r.mipmaps&&r.mipmaps.length>0){b.__webglFramebuffer=[];for(let W=0;W<r.mipmaps.length;W++)b.__webglFramebuffer[W]=e.createFramebuffer()}else b.__webglFramebuffer=e.createFramebuffer();if(ie)for(let W=0,Y=H.length;W<Y;W++){const ae=i.get(H[W]);ae.__webglTexture===void 0&&(ae.__webglTexture=e.createTexture(),s.memory.textures++)}if(p.samples>0&&lt(p)===!1){b.__webglMultisampledFramebuffer=e.createFramebuffer(),b.__webglColorRenderbuffer=[],t.bindFramebuffer(e.FRAMEBUFFER,b.__webglMultisampledFramebuffer);for(let W=0;W<H.length;W++){const Y=H[W];b.__webglColorRenderbuffer[W]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,b.__webglColorRenderbuffer[W]);const ae=o.convert(Y.format,Y.colorSpace),Ee=o.convert(Y.type),se=m(Y.internalFormat,ae,Ee,Y.normalized,Y.colorSpace,p.isXRRenderTarget===!0),re=et(p);e.renderbufferStorageMultisample(e.RENDERBUFFER,re,se,p.width,p.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+W,e.RENDERBUFFER,b.__webglColorRenderbuffer[W])}e.bindRenderbuffer(e.RENDERBUFFER,null),p.depthBuffer&&(b.__webglDepthRenderbuffer=e.createRenderbuffer(),at(b.__webglDepthRenderbuffer,p,!0)),t.bindFramebuffer(e.FRAMEBUFFER,null)}}if(J){t.bindTexture(e.TEXTURE_CUBE_MAP,N.__webglTexture),Be(e.TEXTURE_CUBE_MAP,r);for(let W=0;W<6;W++)if(r.mipmaps&&r.mipmaps.length>0)for(let Y=0;Y<r.mipmaps.length;Y++)Ae(b.__webglFramebuffer[W][Y],p,r,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+W,Y);else Ae(b.__webglFramebuffer[W],p,r,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+W,0);c(r)&&w(e.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ie){for(let W=0,Y=H.length;W<Y;W++){const ae=H[W],Ee=i.get(ae);let se=e.TEXTURE_2D;(p.isWebGL3DRenderTarget||p.isWebGLArrayRenderTarget)&&(se=p.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),t.bindTexture(se,Ee.__webglTexture),Be(se,ae),Ae(b.__webglFramebuffer,p,ae,e.COLOR_ATTACHMENT0+W,se,0),c(ae)&&w(se)}t.unbindTexture()}else{let W=e.TEXTURE_2D;if((p.isWebGL3DRenderTarget||p.isWebGLArrayRenderTarget)&&(W=p.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),t.bindTexture(W,N.__webglTexture),Be(W,r),r.mipmaps&&r.mipmaps.length>0)for(let Y=0;Y<r.mipmaps.length;Y++)Ae(b.__webglFramebuffer[Y],p,r,e.COLOR_ATTACHMENT0,W,Y);else Ae(b.__webglFramebuffer,p,r,e.COLOR_ATTACHMENT0,W,0);c(r)&&w(W),t.unbindTexture()}p.depthBuffer&&ke(p)}function st(p){const r=p.textures;for(let b=0,N=r.length;b<N;b++){const H=r[b];if(c(H)){const J=I(p),ie=i.get(H).__webglTexture;t.bindTexture(J,ie),w(J),t.unbindTexture()}}}const ct=[],dt=[];function ht(p){if(p.samples>0){if(lt(p)===!1){const r=p.textures,b=p.width,N=p.height;let H=e.COLOR_BUFFER_BIT;const J=p.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,ie=i.get(p),W=r.length>1;if(W)for(let ae=0;ae<r.length;ae++)t.bindFramebuffer(e.FRAMEBUFFER,ie.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+ae,e.RENDERBUFFER,null),t.bindFramebuffer(e.FRAMEBUFFER,ie.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+ae,e.TEXTURE_2D,null,0);t.bindFramebuffer(e.READ_FRAMEBUFFER,ie.__webglMultisampledFramebuffer);const Y=p.texture.mipmaps;Y&&Y.length>0?t.bindFramebuffer(e.DRAW_FRAMEBUFFER,ie.__webglFramebuffer[0]):t.bindFramebuffer(e.DRAW_FRAMEBUFFER,ie.__webglFramebuffer);for(let ae=0;ae<r.length;ae++){if(p.resolveDepthBuffer&&(p.depthBuffer&&(H|=e.DEPTH_BUFFER_BIT),p.stencilBuffer&&p.resolveStencilBuffer&&(H|=e.STENCIL_BUFFER_BIT)),W){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,ie.__webglColorRenderbuffer[ae]);const Ee=i.get(r[ae]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,Ee,0)}e.blitFramebuffer(0,0,b,N,0,0,b,N,H,e.NEAREST),M===!0&&(ct.length=0,dt.length=0,ct.push(e.COLOR_ATTACHMENT0+ae),p.depthBuffer&&p.resolveDepthBuffer===!1&&(ct.push(J),dt.push(J),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,dt)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,ct))}if(t.bindFramebuffer(e.READ_FRAMEBUFFER,null),t.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),W)for(let ae=0;ae<r.length;ae++){t.bindFramebuffer(e.FRAMEBUFFER,ie.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+ae,e.RENDERBUFFER,ie.__webglColorRenderbuffer[ae]);const Ee=i.get(r[ae]).__webglTexture;t.bindFramebuffer(e.FRAMEBUFFER,ie.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+ae,e.TEXTURE_2D,Ee,0)}t.bindFramebuffer(e.DRAW_FRAMEBUFFER,ie.__webglMultisampledFramebuffer)}else if(p.depthBuffer&&p.resolveDepthBuffer===!1&&M){const r=p.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[r])}}}function et(p){return Math.min(a.maxSamples,p.samples)}function lt(p){const r=i.get(p);return p.samples>0&&n.has("WEBGL_multisampled_render_to_texture")===!0&&r.__useRenderToTexture!==!1}function x(p){const r=s.render.frame;F.get(p)!==r&&(F.set(p,r),p.update())}function Et(p,r){const b=p.colorSpace,N=p.format,H=p.type;return p.isCompressedTexture===!0||p.isVideoTexture===!0||b!==Lr&&b!==Yt&&(Je.getTransfer(b)===Ze?(N!==Gt||H!==Rt)&&Ve("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):je("WebGLTextures: Unsupported texture color space:",b)),r}function We(p){return typeof HTMLImageElement<"u"&&p instanceof HTMLImageElement?(g.width=p.naturalWidth||p.width,g.height=p.naturalHeight||p.height):typeof VideoFrame<"u"&&p instanceof VideoFrame?(g.width=p.displayWidth,g.height=p.displayHeight):(g.width=p.width,g.height=p.height),g}this.allocateTextureUnit=q,this.resetTextureUnits=j,this.getTextureUnits=K,this.setTextureUnits=z,this.setTexture2D=Z,this.setTexture2DArray=ee,this.setTexture3D=ce,this.setTextureCube=_e,this.rebindTextures=He,this.setupRenderTarget=Fe,this.updateRenderTargetMipmap=st,this.updateMultisampleRenderTarget=ht,this.setupDepthRenderbuffer=ke,this.setupFrameBufferTexture=Ae,this.useMultisampledRTT=lt,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function ud(e,n){function t(i,a=Yt){let o;const s=Je.getTransfer(a);if(i===Rt)return e.UNSIGNED_BYTE;if(i===_r)return e.UNSIGNED_SHORT_4_4_4_4;if(i===gr)return e.UNSIGNED_SHORT_5_5_5_1;if(i===Bo)return e.UNSIGNED_INT_5_9_9_9_REV;if(i===Ho)return e.UNSIGNED_INT_10F_11F_11F_REV;if(i===Vo)return e.BYTE;if(i===Wo)return e.SHORT;if(i===On)return e.UNSIGNED_SHORT;if(i===Sr)return e.INT;if(i===nn)return e.UNSIGNED_INT;if(i===Kt)return e.FLOAT;if(i===Bt)return e.HALF_FLOAT;if(i===zo)return e.ALPHA;if(i===ko)return e.RGB;if(i===Gt)return e.RGBA;if(i===un)return e.DEPTH_COMPONENT;if(i===cn)return e.DEPTH_STENCIL;if(i===Xo)return e.RED;if(i===mr)return e.RED_INTEGER;if(i===an)return e.RG;if(i===hr)return e.RG_INTEGER;if(i===pr)return e.RGBA_INTEGER;if(i===Kn||i===$n||i===Zn||i===jn)if(s===Ze)if(o=n.get("WEBGL_compressed_texture_s3tc_srgb"),o!==null){if(i===Kn)return o.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===$n)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Zn)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===jn)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(o=n.get("WEBGL_compressed_texture_s3tc"),o!==null){if(i===Kn)return o.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===$n)return o.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Zn)return o.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===jn)return o.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Bi||i===Hi||i===Vi||i===Wi)if(o=n.get("WEBGL_compressed_texture_pvrtc"),o!==null){if(i===Bi)return o.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Hi)return o.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Vi)return o.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Wi)return o.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===zi||i===ki||i===Xi||i===qi||i===Yi||i===_i||i===Ki)if(o=n.get("WEBGL_compressed_texture_etc"),o!==null){if(i===zi||i===ki)return s===Ze?o.COMPRESSED_SRGB8_ETC2:o.COMPRESSED_RGB8_ETC2;if(i===Xi)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:o.COMPRESSED_RGBA8_ETC2_EAC;if(i===qi)return o.COMPRESSED_R11_EAC;if(i===Yi)return o.COMPRESSED_SIGNED_R11_EAC;if(i===_i)return o.COMPRESSED_RG11_EAC;if(i===Ki)return o.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===$i||i===Zi||i===ji||i===Qi||i===Ji||i===ea||i===ta||i===na||i===ia||i===aa||i===ra||i===oa||i===sa||i===la)if(o=n.get("WEBGL_compressed_texture_astc"),o!==null){if(i===$i)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:o.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Zi)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:o.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===ji)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:o.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Qi)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:o.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Ji)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:o.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===ea)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:o.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===ta)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:o.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===na)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:o.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===ia)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:o.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===aa)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:o.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===ra)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:o.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===oa)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:o.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===sa)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:o.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===la)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:o.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===ca||i===fa||i===ua)if(o=n.get("EXT_texture_compression_bptc"),o!==null){if(i===ca)return s===Ze?o.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:o.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===fa)return o.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===ua)return o.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===da||i===pa||i===gi||i===ha)if(o=n.get("EXT_texture_compression_rgtc"),o!==null){if(i===da)return o.COMPRESSED_RED_RGTC1_EXT;if(i===pa)return o.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===gi)return o.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===ha)return o.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Mn?e.UNSIGNED_INT_24_8:e[i]!==void 0?e[i]:null}return{convert:t}}const dd=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,pd=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class hd{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(n,t){if(this.texture===null){const i=new vr(n.texture);(n.depthNear!==t.depthNear||n.depthFar!==t.depthFar)&&(this.depthNear=n.depthNear,this.depthFar=n.depthFar),this.texture=i}}getMesh(n){if(this.texture!==null&&this.mesh===null){const t=n.cameras[0].viewport,i=new Vt({vertexShader:dd,fragmentShader:pd,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Ht(new bi(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class md extends io{constructor(n,t){super();const i=this;let a=null,o=1,s=null,d="local-floor",M=1,g=null,F=null,C=null,h=null,S=null,R=null;const B=typeof XRWebGLBinding<"u",u=new hd,c={},w=t.getContextAttributes();let I=null,m=null;const A=[],v=[],P=new it;let f=null;const _=new In;_.viewport=new pt;const y=new In;y.viewport=new pt;const D=[_,y],O=new ao;let j=null,K=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(k){let ne=A[k];return ne===void 0&&(ne=new qn,A[k]=ne),ne.getTargetRaySpace()},this.getControllerGrip=function(k){let ne=A[k];return ne===void 0&&(ne=new qn,A[k]=ne),ne.getGripSpace()},this.getHand=function(k){let ne=A[k];return ne===void 0&&(ne=new qn,A[k]=ne),ne.getHandSpace()};function z(k){const ne=v.indexOf(k.inputSource);if(ne===-1)return;const Q=A[ne];Q!==void 0&&(Q.update(k.inputSource,k.frame,g||s),Q.dispatchEvent({type:k.type,data:k.inputSource}))}function q(){a.removeEventListener("select",z),a.removeEventListener("selectstart",z),a.removeEventListener("selectend",z),a.removeEventListener("squeeze",z),a.removeEventListener("squeezestart",z),a.removeEventListener("squeezeend",z),a.removeEventListener("end",q),a.removeEventListener("inputsourceschange",V);for(let k=0;k<A.length;k++){const ne=v[k];ne!==null&&(v[k]=null,A[k].disconnect(ne))}j=null,K=null,u.reset();for(const k in c)delete c[k];n.setRenderTarget(I),S=null,h=null,C=null,a=null,m=null,Be.stop(),i.isPresenting=!1,n.setPixelRatio(f),n.setSize(P.width,P.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(k){o=k,i.isPresenting===!0&&Ve("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(k){d=k,i.isPresenting===!0&&Ve("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return g||s},this.setReferenceSpace=function(k){g=k},this.getBaseLayer=function(){return h!==null?h:S},this.getBinding=function(){return C===null&&B&&(C=new XRWebGLBinding(a,t)),C},this.getFrame=function(){return R},this.getSession=function(){return a},this.setSession=async function(k){if(a=k,a!==null){if(I=n.getRenderTarget(),a.addEventListener("select",z),a.addEventListener("selectstart",z),a.addEventListener("selectend",z),a.addEventListener("squeeze",z),a.addEventListener("squeezestart",z),a.addEventListener("squeezeend",z),a.addEventListener("end",q),a.addEventListener("inputsourceschange",V),w.xrCompatible!==!0&&await t.makeXRCompatible(),f=n.getPixelRatio(),n.getSize(P),B&&"createProjectionLayer"in XRWebGLBinding.prototype){let Q=null,Re=null,Ce=null;w.depth&&(Ce=w.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Q=w.stencil?cn:un,Re=w.stencil?Mn:nn);const Ae={colorFormat:t.RGBA8,depthFormat:Ce,scaleFactor:o};C=this.getBinding(),h=C.createProjectionLayer(Ae),a.updateRenderState({layers:[h]}),n.setPixelRatio(1),n.setSize(h.textureWidth,h.textureHeight,!1),m=new Pt(h.textureWidth,h.textureHeight,{format:Gt,type:Rt,depthTexture:new xn(h.textureWidth,h.textureHeight,Re,void 0,void 0,void 0,void 0,void 0,void 0,Q),stencilBuffer:w.stencil,colorSpace:n.outputColorSpace,samples:w.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1})}else{const Q={antialias:w.antialias,alpha:!0,depth:w.depth,stencil:w.stencil,framebufferScaleFactor:o};S=new XRWebGLLayer(a,t,Q),a.updateRenderState({baseLayer:S}),n.setPixelRatio(1),n.setSize(S.framebufferWidth,S.framebufferHeight,!1),m=new Pt(S.framebufferWidth,S.framebufferHeight,{format:Gt,type:Rt,colorSpace:n.outputColorSpace,stencilBuffer:w.stencil,resolveDepthBuffer:S.ignoreDepthValues===!1,resolveStencilBuffer:S.ignoreDepthValues===!1})}m.isXRRenderTarget=!0,this.setFoveation(M),g=null,s=await a.requestReferenceSpace(d),Be.setContext(a),Be.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(a!==null)return a.environmentBlendMode},this.getDepthTexture=function(){return u.getDepthTexture()};function V(k){for(let ne=0;ne<k.removed.length;ne++){const Q=k.removed[ne],Re=v.indexOf(Q);Re>=0&&(v[Re]=null,A[Re].disconnect(Q))}for(let ne=0;ne<k.added.length;ne++){const Q=k.added[ne];let Re=v.indexOf(Q);if(Re===-1){for(let Ae=0;Ae<A.length;Ae++)if(Ae>=v.length){v.push(Q),Re=Ae;break}else if(v[Ae]===null){v[Ae]=Q,Re=Ae;break}if(Re===-1)break}const Ce=A[Re];Ce&&Ce.connect(Q)}}const Z=new Ie,ee=new Ie;function ce(k,ne,Q){Z.setFromMatrixPosition(ne.matrixWorld),ee.setFromMatrixPosition(Q.matrixWorld);const Re=Z.distanceTo(ee),Ce=ne.projectionMatrix.elements,Ae=Q.projectionMatrix.elements,at=Ce[14]/(Ce[10]-1),Ne=Ce[14]/(Ce[10]+1),ke=(Ce[9]+1)/Ce[5],He=(Ce[9]-1)/Ce[5],Fe=(Ce[8]-1)/Ce[0],st=(Ae[8]+1)/Ae[0],ct=at*Fe,dt=at*st,ht=Re/(-Fe+st),et=ht*-Fe;if(ne.matrixWorld.decompose(k.position,k.quaternion,k.scale),k.translateX(et),k.translateZ(ht),k.matrixWorld.compose(k.position,k.quaternion,k.scale),k.matrixWorldInverse.copy(k.matrixWorld).invert(),Ce[10]===-1)k.projectionMatrix.copy(ne.projectionMatrix),k.projectionMatrixInverse.copy(ne.projectionMatrixInverse);else{const lt=at+ht,x=Ne+ht,Et=ct-et,We=dt+(Re-et),p=ke*Ne/x*lt,r=He*Ne/x*lt;k.projectionMatrix.makePerspective(Et,We,p,r,lt,x),k.projectionMatrixInverse.copy(k.projectionMatrix).invert()}}function _e(k,ne){ne===null?k.matrixWorld.copy(k.matrix):k.matrixWorld.multiplyMatrices(ne.matrixWorld,k.matrix),k.matrixWorldInverse.copy(k.matrixWorld).invert()}this.updateCamera=function(k){if(a===null)return;let ne=k.near,Q=k.far;u.texture!==null&&(u.depthNear>0&&(ne=u.depthNear),u.depthFar>0&&(Q=u.depthFar)),O.near=y.near=_.near=ne,O.far=y.far=_.far=Q,(j!==O.near||K!==O.far)&&(a.updateRenderState({depthNear:O.near,depthFar:O.far}),j=O.near,K=O.far),O.layers.mask=k.layers.mask|6,_.layers.mask=O.layers.mask&-5,y.layers.mask=O.layers.mask&-3;const Re=k.parent,Ce=O.cameras;_e(O,Re);for(let Ae=0;Ae<Ce.length;Ae++)_e(Ce[Ae],Re);Ce.length===2?ce(O,_,y):O.projectionMatrix.copy(_.projectionMatrix),ve(k,O,Re)};function ve(k,ne,Q){Q===null?k.matrix.copy(ne.matrixWorld):(k.matrix.copy(Q.matrixWorld),k.matrix.invert(),k.matrix.multiply(ne.matrixWorld)),k.matrix.decompose(k.position,k.quaternion,k.scale),k.updateMatrixWorld(!0),k.projectionMatrix.copy(ne.projectionMatrix),k.projectionMatrixInverse.copy(ne.projectionMatrixInverse),k.isPerspectiveCamera&&(k.fov=ro*2*Math.atan(1/k.projectionMatrix.elements[5]),k.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(!(h===null&&S===null))return M},this.setFoveation=function(k){M=k,h!==null&&(h.fixedFoveation=k),S!==null&&S.fixedFoveation!==void 0&&(S.fixedFoveation=k)},this.hasDepthSensing=function(){return u.texture!==null},this.getDepthSensingMesh=function(){return u.getMesh(O)},this.getCameraTexture=function(k){return c[k]};let Oe=null;function Qe(k,ne){if(F=ne.getViewerPose(g||s),R=ne,F!==null){const Q=F.views;S!==null&&(n.setRenderTargetFramebuffer(m,S.framebuffer),n.setRenderTarget(m));let Re=!1;Q.length!==O.cameras.length&&(O.cameras.length=0,Re=!0);for(let Ne=0;Ne<Q.length;Ne++){const ke=Q[Ne];let He=null;if(S!==null)He=S.getViewport(ke);else{const st=C.getViewSubImage(h,ke);He=st.viewport,Ne===0&&(n.setRenderTargetTextures(m,st.colorTexture,st.depthStencilTexture),n.setRenderTarget(m))}let Fe=D[Ne];Fe===void 0&&(Fe=new In,Fe.layers.enable(Ne),Fe.viewport=new pt,D[Ne]=Fe),Fe.matrix.fromArray(ke.transform.matrix),Fe.matrix.decompose(Fe.position,Fe.quaternion,Fe.scale),Fe.projectionMatrix.fromArray(ke.projectionMatrix),Fe.projectionMatrixInverse.copy(Fe.projectionMatrix).invert(),Fe.viewport.set(He.x,He.y,He.width,He.height),Ne===0&&(O.matrix.copy(Fe.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),Re===!0&&O.cameras.push(Fe)}const Ce=a.enabledFeatures;if(Ce&&Ce.includes("depth-sensing")&&a.depthUsage=="gpu-optimized"&&B){C=i.getBinding();const Ne=C.getDepthInformation(Q[0]);Ne&&Ne.isValid&&Ne.texture&&u.init(Ne,a.renderState)}if(Ce&&Ce.includes("camera-access")&&B){n.state.unbindTexture(),C=i.getBinding();for(let Ne=0;Ne<Q.length;Ne++){const ke=Q[Ne].camera;if(ke){let He=c[ke];He||(He=new vr,c[ke]=He);const Fe=C.getCameraImage(ke);He.sourceTexture=Fe}}}}for(let Q=0;Q<A.length;Q++){const Re=v[Q],Ce=A[Q];Re!==null&&Ce!==void 0&&Ce.update(Re,ne,g||s)}Oe&&Oe(k,ne),ne.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:ne}),R=null}const Be=new Ur;Be.setAnimationLoop(Qe),this.setAnimationLoop=function(k){Oe=k},this.dispose=function(){}}}const _d=new tn,Br=new ye;Br.set(-1,0,0,0,1,0,0,0,1);function gd(e,n){function t(u,c){u.matrixAutoUpdate===!0&&u.updateMatrix(),c.value.copy(u.matrix)}function i(u,c){c.color.getRGB(u.fogColor.value,xr(e)),c.isFog?(u.fogNear.value=c.near,u.fogFar.value=c.far):c.isFogExp2&&(u.fogDensity.value=c.density)}function a(u,c,w,I,m){c.isNodeMaterial?c.uniformsNeedUpdate=!1:c.isMeshBasicMaterial?o(u,c):c.isMeshLambertMaterial?(o(u,c),c.envMap&&(u.envMapIntensity.value=c.envMapIntensity)):c.isMeshToonMaterial?(o(u,c),C(u,c)):c.isMeshPhongMaterial?(o(u,c),F(u,c),c.envMap&&(u.envMapIntensity.value=c.envMapIntensity)):c.isMeshStandardMaterial?(o(u,c),h(u,c),c.isMeshPhysicalMaterial&&S(u,c,m)):c.isMeshMatcapMaterial?(o(u,c),R(u,c)):c.isMeshDepthMaterial?o(u,c):c.isMeshDistanceMaterial?(o(u,c),B(u,c)):c.isMeshNormalMaterial?o(u,c):c.isLineBasicMaterial?(s(u,c),c.isLineDashedMaterial&&d(u,c)):c.isPointsMaterial?M(u,c,w,I):c.isSpriteMaterial?g(u,c):c.isShadowMaterial?(u.color.value.copy(c.color),u.opacity.value=c.opacity):c.isShaderMaterial&&(c.uniformsNeedUpdate=!1)}function o(u,c){u.opacity.value=c.opacity,c.color&&u.diffuse.value.copy(c.color),c.emissive&&u.emissive.value.copy(c.emissive).multiplyScalar(c.emissiveIntensity),c.map&&(u.map.value=c.map,t(c.map,u.mapTransform)),c.alphaMap&&(u.alphaMap.value=c.alphaMap,t(c.alphaMap,u.alphaMapTransform)),c.bumpMap&&(u.bumpMap.value=c.bumpMap,t(c.bumpMap,u.bumpMapTransform),u.bumpScale.value=c.bumpScale,c.side===At&&(u.bumpScale.value*=-1)),c.normalMap&&(u.normalMap.value=c.normalMap,t(c.normalMap,u.normalMapTransform),u.normalScale.value.copy(c.normalScale),c.side===At&&u.normalScale.value.negate()),c.displacementMap&&(u.displacementMap.value=c.displacementMap,t(c.displacementMap,u.displacementMapTransform),u.displacementScale.value=c.displacementScale,u.displacementBias.value=c.displacementBias),c.emissiveMap&&(u.emissiveMap.value=c.emissiveMap,t(c.emissiveMap,u.emissiveMapTransform)),c.specularMap&&(u.specularMap.value=c.specularMap,t(c.specularMap,u.specularMapTransform)),c.alphaTest>0&&(u.alphaTest.value=c.alphaTest);const w=n.get(c),I=w.envMap,m=w.envMapRotation;I&&(u.envMap.value=I,u.envMapRotation.value.setFromMatrix4(_d.makeRotationFromEuler(m)).transpose(),I.isCubeTexture&&I.isRenderTargetTexture===!1&&u.envMapRotation.value.premultiply(Br),u.reflectivity.value=c.reflectivity,u.ior.value=c.ior,u.refractionRatio.value=c.refractionRatio),c.lightMap&&(u.lightMap.value=c.lightMap,u.lightMapIntensity.value=c.lightMapIntensity,t(c.lightMap,u.lightMapTransform)),c.aoMap&&(u.aoMap.value=c.aoMap,u.aoMapIntensity.value=c.aoMapIntensity,t(c.aoMap,u.aoMapTransform))}function s(u,c){u.diffuse.value.copy(c.color),u.opacity.value=c.opacity,c.map&&(u.map.value=c.map,t(c.map,u.mapTransform))}function d(u,c){u.dashSize.value=c.dashSize,u.totalSize.value=c.dashSize+c.gapSize,u.scale.value=c.scale}function M(u,c,w,I){u.diffuse.value.copy(c.color),u.opacity.value=c.opacity,u.size.value=c.size*w,u.scale.value=I*.5,c.map&&(u.map.value=c.map,t(c.map,u.uvTransform)),c.alphaMap&&(u.alphaMap.value=c.alphaMap,t(c.alphaMap,u.alphaMapTransform)),c.alphaTest>0&&(u.alphaTest.value=c.alphaTest)}function g(u,c){u.diffuse.value.copy(c.color),u.opacity.value=c.opacity,u.rotation.value=c.rotation,c.map&&(u.map.value=c.map,t(c.map,u.mapTransform)),c.alphaMap&&(u.alphaMap.value=c.alphaMap,t(c.alphaMap,u.alphaMapTransform)),c.alphaTest>0&&(u.alphaTest.value=c.alphaTest)}function F(u,c){u.specular.value.copy(c.specular),u.shininess.value=Math.max(c.shininess,1e-4)}function C(u,c){c.gradientMap&&(u.gradientMap.value=c.gradientMap)}function h(u,c){u.metalness.value=c.metalness,c.metalnessMap&&(u.metalnessMap.value=c.metalnessMap,t(c.metalnessMap,u.metalnessMapTransform)),u.roughness.value=c.roughness,c.roughnessMap&&(u.roughnessMap.value=c.roughnessMap,t(c.roughnessMap,u.roughnessMapTransform)),c.envMap&&(u.envMapIntensity.value=c.envMapIntensity)}function S(u,c,w){u.ior.value=c.ior,c.sheen>0&&(u.sheenColor.value.copy(c.sheenColor).multiplyScalar(c.sheen),u.sheenRoughness.value=c.sheenRoughness,c.sheenColorMap&&(u.sheenColorMap.value=c.sheenColorMap,t(c.sheenColorMap,u.sheenColorMapTransform)),c.sheenRoughnessMap&&(u.sheenRoughnessMap.value=c.sheenRoughnessMap,t(c.sheenRoughnessMap,u.sheenRoughnessMapTransform))),c.clearcoat>0&&(u.clearcoat.value=c.clearcoat,u.clearcoatRoughness.value=c.clearcoatRoughness,c.clearcoatMap&&(u.clearcoatMap.value=c.clearcoatMap,t(c.clearcoatMap,u.clearcoatMapTransform)),c.clearcoatRoughnessMap&&(u.clearcoatRoughnessMap.value=c.clearcoatRoughnessMap,t(c.clearcoatRoughnessMap,u.clearcoatRoughnessMapTransform)),c.clearcoatNormalMap&&(u.clearcoatNormalMap.value=c.clearcoatNormalMap,t(c.clearcoatNormalMap,u.clearcoatNormalMapTransform),u.clearcoatNormalScale.value.copy(c.clearcoatNormalScale),c.side===At&&u.clearcoatNormalScale.value.negate())),c.dispersion>0&&(u.dispersion.value=c.dispersion),c.iridescence>0&&(u.iridescence.value=c.iridescence,u.iridescenceIOR.value=c.iridescenceIOR,u.iridescenceThicknessMinimum.value=c.iridescenceThicknessRange[0],u.iridescenceThicknessMaximum.value=c.iridescenceThicknessRange[1],c.iridescenceMap&&(u.iridescenceMap.value=c.iridescenceMap,t(c.iridescenceMap,u.iridescenceMapTransform)),c.iridescenceThicknessMap&&(u.iridescenceThicknessMap.value=c.iridescenceThicknessMap,t(c.iridescenceThicknessMap,u.iridescenceThicknessMapTransform))),c.transmission>0&&(u.transmission.value=c.transmission,u.transmissionSamplerMap.value=w.texture,u.transmissionSamplerSize.value.set(w.width,w.height),c.transmissionMap&&(u.transmissionMap.value=c.transmissionMap,t(c.transmissionMap,u.transmissionMapTransform)),u.thickness.value=c.thickness,c.thicknessMap&&(u.thicknessMap.value=c.thicknessMap,t(c.thicknessMap,u.thicknessMapTransform)),u.attenuationDistance.value=c.attenuationDistance,u.attenuationColor.value.copy(c.attenuationColor)),c.anisotropy>0&&(u.anisotropyVector.value.set(c.anisotropy*Math.cos(c.anisotropyRotation),c.anisotropy*Math.sin(c.anisotropyRotation)),c.anisotropyMap&&(u.anisotropyMap.value=c.anisotropyMap,t(c.anisotropyMap,u.anisotropyMapTransform))),u.specularIntensity.value=c.specularIntensity,u.specularColor.value.copy(c.specularColor),c.specularColorMap&&(u.specularColorMap.value=c.specularColorMap,t(c.specularColorMap,u.specularColorMapTransform)),c.specularIntensityMap&&(u.specularIntensityMap.value=c.specularIntensityMap,t(c.specularIntensityMap,u.specularIntensityMapTransform))}function R(u,c){c.matcap&&(u.matcap.value=c.matcap)}function B(u,c){const w=n.get(c).light;u.referencePosition.value.setFromMatrixPosition(w.matrixWorld),u.nearDistance.value=w.shadow.camera.near,u.farDistance.value=w.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:a}}function vd(e,n,t,i){let a={},o={},s=[];const d=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function M(m,A){const v=A.program;i.uniformBlockBinding(m,v)}function g(m,A){let v=a[m.id];v===void 0&&(u(m),v=F(m),a[m.id]=v,m.addEventListener("dispose",w));const P=A.program;i.updateUBOMapping(m,P);const f=n.render.frame;o[m.id]!==f&&(h(m),o[m.id]=f)}function F(m){const A=C();m.__bindingPointIndex=A;const v=e.createBuffer(),P=m.__size,f=m.usage;return e.bindBuffer(e.UNIFORM_BUFFER,v),e.bufferData(e.UNIFORM_BUFFER,P,f),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,A,v),v}function C(){for(let m=0;m<d;m++)if(s.indexOf(m)===-1)return s.push(m),m;return je("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(m){const A=a[m.id],v=m.uniforms,P=m.__cache;e.bindBuffer(e.UNIFORM_BUFFER,A);for(let f=0,_=v.length;f<_;f++){const y=v[f];if(Array.isArray(y))for(let D=0,O=y.length;D<O;D++)S(y[D],f,D,P);else S(y,f,0,P)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function S(m,A,v,P){if(B(m,A,v,P)===!0){const f=m.__offset,_=m.value;if(Array.isArray(_)){let y=0;for(let D=0;D<_.length;D++){const O=_[D],j=c(O);R(O,m.__data,y),typeof O!="number"&&typeof O!="boolean"&&!O.isMatrix3&&!ArrayBuffer.isView(O)&&(y+=j.storage/Float32Array.BYTES_PER_ELEMENT)}}else R(_,m.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,f,m.__data)}}function R(m,A,v){typeof m=="number"||typeof m=="boolean"?A[0]=m:m.isMatrix3?(A[0]=m.elements[0],A[1]=m.elements[1],A[2]=m.elements[2],A[3]=0,A[4]=m.elements[3],A[5]=m.elements[4],A[6]=m.elements[5],A[7]=0,A[8]=m.elements[6],A[9]=m.elements[7],A[10]=m.elements[8],A[11]=0):ArrayBuffer.isView(m)?A.set(new m.constructor(m.buffer,m.byteOffset,A.length)):m.toArray(A,v)}function B(m,A,v,P){const f=m.value,_=A+"_"+v;if(P[_]===void 0)return typeof f=="number"||typeof f=="boolean"?P[_]=f:ArrayBuffer.isView(f)?P[_]=f.slice():P[_]=f.clone(),!0;{const y=P[_];if(typeof f=="number"||typeof f=="boolean"){if(y!==f)return P[_]=f,!0}else{if(ArrayBuffer.isView(f))return!0;if(y.equals(f)===!1)return y.copy(f),!0}}return!1}function u(m){const A=m.uniforms;let v=0;const P=16;for(let _=0,y=A.length;_<y;_++){const D=Array.isArray(A[_])?A[_]:[A[_]];for(let O=0,j=D.length;O<j;O++){const K=D[O],z=Array.isArray(K.value)?K.value:[K.value];for(let q=0,V=z.length;q<V;q++){const Z=z[q],ee=c(Z),ce=v%P,_e=ce%ee.boundary,ve=ce+_e;v+=_e,ve!==0&&P-ve<ee.storage&&(v+=P-ve),K.__data=new Float32Array(ee.storage/Float32Array.BYTES_PER_ELEMENT),K.__offset=v,v+=ee.storage}}}const f=v%P;return f>0&&(v+=P-f),m.__size=v,m.__cache={},this}function c(m){const A={boundary:0,storage:0};return typeof m=="number"||typeof m=="boolean"?(A.boundary=4,A.storage=4):m.isVector2?(A.boundary=8,A.storage=8):m.isVector3||m.isColor?(A.boundary=16,A.storage=12):m.isVector4?(A.boundary=16,A.storage=16):m.isMatrix3?(A.boundary=48,A.storage=48):m.isMatrix4?(A.boundary=64,A.storage=64):m.isTexture?Ve("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(m)?(A.boundary=16,A.storage=m.byteLength):Ve("WebGLRenderer: Unsupported uniform value type.",m),A}function w(m){const A=m.target;A.removeEventListener("dispose",w);const v=s.indexOf(A.__bindingPointIndex);s.splice(v,1),e.deleteBuffer(a[A.id]),delete a[A.id],delete o[A.id]}function I(){for(const m in a)e.deleteBuffer(a[m]);s=[],a={},o={}}return{bind:M,update:g,dispose:I}}const Sd=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let Nt=null;function Ed(){return Nt===null&&(Nt=new dr(Sd,16,16,an,Bt),Nt.name="DFG_LUT",Nt.minFilter=_t,Nt.magFilter=_t,Nt.wrapS=Tn,Nt.wrapT=Tn,Nt.generateMipmaps=!1,Nt.needsUpdate=!0),Nt}class sh{constructor(n={}){const{canvas:t=Qr(),context:i=null,depth:a=!0,stencil:o=!1,alpha:s=!1,antialias:d=!1,premultipliedAlpha:M=!0,preserveDrawingBuffer:g=!1,powerPreference:F="default",failIfMajorPerformanceCaveat:C=!1,reversedDepthBuffer:h=!1,outputBufferType:S=Rt}=n;this.isWebGLRenderer=!0;let R;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");R=i.getContextAttributes().alpha}else R=s;const B=S,u=new Set([pr,hr,mr]),c=new Set([Rt,nn,On,Mn,_r,gr]),w=new Uint32Array(4),I=new Int32Array(4),m=new Ie;let A=null,v=null;const P=[],f=[];let _=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Ot,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const y=this;let D=!1,O=null,j=null,K=null,z=null;this._outputColorSpace=Jr;let q=0,V=0,Z=null,ee=-1,ce=null;const _e=new pt,ve=new pt;let Oe=null;const Qe=new Ye(0);let Be=0,k=t.width,ne=t.height,Q=1,Re=null,Ce=null;const Ae=new pt(0,0,k,ne),at=new pt(0,0,k,ne);let Ne=!1;const ke=new xi;let He=!1,Fe=!1;const st=new tn,ct=new Ie,dt=new pt,ht={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let et=!1;function lt(){return Z===null?Q:1}let x=i;function Et(l,T){return t.getContext(l,T)}try{const l={alpha:!0,depth:a,stencil:o,antialias:d,premultipliedAlpha:M,preserveDrawingBuffer:g,powerPreference:F,failIfMajorPerformanceCaveat:C};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${eo}`),t.addEventListener("webglcontextlost",tt,!1),t.addEventListener("webglcontextrestored",Ke,!1),t.addEventListener("webglcontextcreationerror",Lt,!1),x===null){const T="webgl2";if(x=Et(T,l),x===null)throw Et(T)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}}catch(l){throw je("WebGLRenderer: "+l.message),l}let We,p,r,b,N,H,J,ie,W,Y,ae,Ee,se,re,Te,be,De,E,te,X,oe,de,$;function Se(){We=new Ef(x),We.init(),oe=new ud(x,We),p=new df(x,We,n,oe),r=new cd(x,We),p.reversedDepthBuffer&&h&&r.buffers.depth.setReversed(!0),j=x.createFramebuffer(),K=x.createFramebuffer(),z=x.createFramebuffer(),b=new Tf(x),N=new $u,H=new fd(x,We,r,N,p,oe,b),J=new Sf(y),ie=new Rs(x),de=new ff(x,ie),W=new xf(x,ie,b,de),Y=new bf(x,W,ie,de,b),E=new Af(x,p,H),Te=new pf(N),ae=new Ku(y,J,We,p,de,Te),Ee=new gd(y,N),se=new ju,re=new id(We),De=new cf(y,J,r,Y,R,M),be=new ld(y,Y,p),$=new vd(x,b,p,r),te=new uf(x,We,b),X=new Mf(x,We,b),b.programs=ae.programs,y.capabilities=p,y.extensions=We,y.properties=N,y.renderLists=se,y.shadowMap=be,y.state=r,y.info=b}Se(),B!==Rt&&(_=new Cf(B,t.width,t.height,d,a,o));const me=new md(y,x);this.xr=me,this.getContext=function(){return x},this.getContextAttributes=function(){return x.getContextAttributes()},this.forceContextLoss=function(){const l=We.get("WEBGL_lose_context");l&&l.loseContext()},this.forceContextRestore=function(){const l=We.get("WEBGL_lose_context");l&&l.restoreContext()},this.getPixelRatio=function(){return Q},this.setPixelRatio=function(l){l!==void 0&&(Q=l,this.setSize(k,ne,!1))},this.getSize=function(l){return l.set(k,ne)},this.setSize=function(l,T,G=!0){if(me.isPresenting){Ve("WebGLRenderer: Can't change size while VR device is presenting.");return}k=l,ne=T,t.width=Math.floor(l*Q),t.height=Math.floor(T*Q),G===!0&&(t.style.width=l+"px",t.style.height=T+"px"),_!==null&&_.setSize(t.width,t.height),this.setViewport(0,0,l,T)},this.getDrawingBufferSize=function(l){return l.set(k*Q,ne*Q).floor()},this.setDrawingBufferSize=function(l,T,G){k=l,ne=T,Q=G,t.width=Math.floor(l*G),t.height=Math.floor(T*G),this.setViewport(0,0,l,T)},this.setEffects=function(l){if(B===Rt){je("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(l){for(let T=0;T<l.length;T++)if(l[T].isOutputPass===!0){Ve("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}_.setEffects(l||[])},this.getCurrentViewport=function(l){return l.copy(_e)},this.getViewport=function(l){return l.copy(Ae)},this.setViewport=function(l,T,G,L){l.isVector4?Ae.set(l.x,l.y,l.z,l.w):Ae.set(l,T,G,L),r.viewport(_e.copy(Ae).multiplyScalar(Q).round())},this.getScissor=function(l){return l.copy(at)},this.setScissor=function(l,T,G,L){l.isVector4?at.set(l.x,l.y,l.z,l.w):at.set(l,T,G,L),r.scissor(ve.copy(at).multiplyScalar(Q).round())},this.getScissorTest=function(){return Ne},this.setScissorTest=function(l){r.setScissorTest(Ne=l)},this.setOpaqueSort=function(l){Re=l},this.setTransparentSort=function(l){Ce=l},this.getClearColor=function(l){return l.copy(De.getClearColor())},this.setClearColor=function(){De.setClearColor(...arguments)},this.getClearAlpha=function(){return De.getClearAlpha()},this.setClearAlpha=function(){De.setClearAlpha(...arguments)},this.clear=function(l=!0,T=!0,G=!0){let L=0;if(l){let U=!1;if(Z!==null){const ue=Z.texture.format;U=u.has(ue)}if(U){const ue=Z.texture.type,he=c.has(ue),fe=De.getClearColor(),ge=De.getClearAlpha(),xe=fe.r,Pe=fe.g,Ue=fe.b;he?(w[0]=xe,w[1]=Pe,w[2]=Ue,w[3]=ge,x.clearBufferuiv(x.COLOR,0,w)):(I[0]=xe,I[1]=Pe,I[2]=Ue,I[3]=ge,x.clearBufferiv(x.COLOR,0,I))}else L|=x.COLOR_BUFFER_BIT}T&&(L|=x.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),G&&(L|=x.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),L!==0&&x.clear(L)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(l){l.setRenderer(this),O=l},this.dispose=function(){t.removeEventListener("webglcontextlost",tt,!1),t.removeEventListener("webglcontextrestored",Ke,!1),t.removeEventListener("webglcontextcreationerror",Lt,!1),De.dispose(),se.dispose(),re.dispose(),N.dispose(),J.dispose(),Y.dispose(),de.dispose(),$.dispose(),ae.dispose(),me.dispose(),me.removeEventListener("sessionstart",Di),me.removeEventListener("sessionend",Pi),Zt.stop()};function tt(l){l.preventDefault(),Fi("WebGLRenderer: Context Lost."),D=!0}function Ke(){Fi("WebGLRenderer: Context Restored."),D=!1;const l=b.autoReset,T=be.enabled,G=be.autoUpdate,L=be.needsUpdate,U=be.type;Se(),b.autoReset=l,be.enabled=T,be.autoUpdate=G,be.needsUpdate=L,be.type=U}function Lt(l){je("WebGLRenderer: A WebGL context could not be created. Reason: ",l.statusMessage)}function wt(l){const T=l.target;T.removeEventListener("dispose",wt),zr(T)}function zr(l){kr(l),N.remove(l)}function kr(l){const T=N.get(l).programs;T!==void 0&&(T.forEach(function(G){ae.releaseProgram(G)}),l.isShaderMaterial&&ae.releaseShaderCache(l))}this.renderBufferDirect=function(l,T,G,L,U,ue){T===null&&(T=ht);const he=U.isMesh&&U.matrixWorld.determinantAffine()<0,fe=Yr(l,T,G,L,U);r.setMaterial(L,he);let ge=G.index,xe=1;if(L.wireframe===!0){if(ge=W.getWireframeAttribute(G),ge===void 0)return;xe=2}const Pe=G.drawRange,Ue=G.attributes.position;let Me=Pe.start*xe,ze=(Pe.start+Pe.count)*xe;ue!==null&&(Me=Math.max(Me,ue.start*xe),ze=Math.min(ze,(ue.start+ue.count)*xe)),ge!==null?(Me=Math.max(Me,0),ze=Math.min(ze,ge.count)):Ue!=null&&(Me=Math.max(Me,0),ze=Math.min(ze,Ue.count));const rt=ze-Me;if(rt<0||rt===1/0)return;de.setup(U,L,fe,G,ge);let nt,Xe=te;if(ge!==null&&(nt=ie.get(ge),Xe=X,Xe.setIndex(nt)),U.isMesh)L.wireframe===!0?(r.setLineWidth(L.wireframeLinewidth*lt()),Xe.setMode(x.LINES)):Xe.setMode(x.TRIANGLES);else if(U.isLine){let gt=L.linewidth;gt===void 0&&(gt=1),r.setLineWidth(gt*lt()),U.isLineSegments?Xe.setMode(x.LINES):U.isLineLoop?Xe.setMode(x.LINE_LOOP):Xe.setMode(x.LINE_STRIP)}else U.isPoints?Xe.setMode(x.POINTS):U.isSprite&&Xe.setMode(x.TRIANGLES);if(U.isBatchedMesh)if(We.get("WEBGL_multi_draw"))Xe.renderMultiDraw(U._multiDrawStarts,U._multiDrawCounts,U._multiDrawCount);else{const gt=U._multiDrawStarts,pe=U._multiDrawCounts,Tt=U._multiDrawCount,Ge=ge?ie.get(ge).bytesPerElement:1,bt=N.get(L).currentProgram.getUniforms();for(let Ut=0;Ut<Tt;Ut++)bt.setValue(x,"_gl_DrawID",Ut),Xe.render(gt[Ut]/Ge,pe[Ut])}else if(U.isInstancedMesh)Xe.renderInstances(Me,rt,U.count);else if(G.isInstancedBufferGeometry){const gt=G._maxInstanceCount!==void 0?G._maxInstanceCount:1/0,pe=Math.min(G.instanceCount,gt);Xe.renderInstances(Me,rt,pe)}else Xe.render(Me,rt)};function Ci(l,T,G){l.transparent===!0&&l.side===Ft&&l.forceSinglePass===!1?(l.side=At,l.needsUpdate=!0,Cn(l,T,G),l.side=En,l.needsUpdate=!0,Cn(l,T,G),l.side=Ft):Cn(l,T,G)}this.compile=function(l,T,G=null){G===null&&(G=l),v=re.get(G),v.init(T),f.push(v),G.traverseVisible(function(U){U.isLight&&U.layers.test(T.layers)&&(v.pushLight(U),U.castShadow&&v.pushShadow(U))}),l!==G&&l.traverseVisible(function(U){U.isLight&&U.layers.test(T.layers)&&(v.pushLight(U),U.castShadow&&v.pushShadow(U))}),v.setupLights();const L=new Set;return l.traverse(function(U){if(!(U.isMesh||U.isPoints||U.isLine||U.isSprite))return;const ue=U.material;if(ue)if(Array.isArray(ue))for(let he=0;he<ue.length;he++){const fe=ue[he];Ci(fe,G,U),L.add(fe)}else Ci(ue,G,U),L.add(ue)}),v=f.pop(),L},this.compileAsync=function(l,T,G=null){const L=this.compile(l,T,G);return new Promise(U=>{function ue(){if(L.forEach(function(he){N.get(he).currentProgram.isReady()&&L.delete(he)}),L.size===0){U(l);return}setTimeout(ue,10)}We.get("KHR_parallel_shader_compile")!==null?ue():setTimeout(ue,10)})};let kn=null;function Xr(l){kn&&kn(l)}function Di(){Zt.stop()}function Pi(){Zt.start()}const Zt=new Ur;Zt.setAnimationLoop(Xr),typeof self<"u"&&Zt.setContext(self),this.setAnimationLoop=function(l){kn=l,me.setAnimationLoop(l),l===null?Zt.stop():Zt.start()},me.addEventListener("sessionstart",Di),me.addEventListener("sessionend",Pi),this.render=function(l,T){if(T!==void 0&&T.isCamera!==!0){je("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(D===!0)return;O!==null&&O.renderStart(l,T);const G=me.enabled===!0&&me.isPresenting===!0,L=_!==null&&(Z===null||G)&&_.begin(y,Z);if(l.matrixWorldAutoUpdate===!0&&l.updateMatrixWorld(),T.parent===null&&T.matrixWorldAutoUpdate===!0&&T.updateMatrixWorld(),me.enabled===!0&&me.isPresenting===!0&&(_===null||_.isCompositing()===!1)&&(me.cameraAutoUpdate===!0&&me.updateCamera(T),T=me.getCamera()),l.isScene===!0&&l.onBeforeRender(y,l,T,Z),v=re.get(l,f.length),v.init(T),v.state.textureUnits=H.getTextureUnits(),f.push(v),st.multiplyMatrices(T.projectionMatrix,T.matrixWorldInverse),ke.setFromProjectionMatrix(st,Gi,T.reversedDepth),Fe=this.localClippingEnabled,He=Te.init(this.clippingPlanes,Fe),A=se.get(l,P.length),A.init(),P.push(A),me.enabled===!0&&me.isPresenting===!0){const he=y.xr.getDepthSensingMesh();he!==null&&Xn(he,T,-1/0,y.sortObjects)}Xn(l,T,0,y.sortObjects),A.finish(),y.sortObjects===!0&&A.sort(Re,Ce,T.reversedDepth),et=me.enabled===!1||me.isPresenting===!1||me.hasDepthSensing()===!1,et&&De.addToRenderList(A,l),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),He===!0&&Te.beginShadows();const U=v.state.shadowsArray;if(be.render(U,l,T),He===!0&&Te.endShadows(),(L&&_.hasRenderPass())===!1){const he=A.opaque,fe=A.transmissive;if(v.setupLights(),T.isArrayCamera){const ge=T.cameras;if(fe.length>0)for(let xe=0,Pe=ge.length;xe<Pe;xe++){const Ue=ge[xe];wi(he,fe,l,Ue)}et&&De.render(l);for(let xe=0,Pe=ge.length;xe<Pe;xe++){const Ue=ge[xe];Li(A,l,Ue,Ue.viewport)}}else fe.length>0&&wi(he,fe,l,T),et&&De.render(l),Li(A,l,T)}Z!==null&&V===0&&(H.updateMultisampleRenderTarget(Z),H.updateRenderTargetMipmap(Z)),L&&_.end(y),l.isScene===!0&&l.onAfterRender(y,l,T),de.resetDefaultState(),ee=-1,ce=null,f.pop(),f.length>0?(v=f[f.length-1],H.setTextureUnits(v.state.textureUnits),He===!0&&Te.setGlobalState(y.clippingPlanes,v.state.camera)):v=null,P.pop(),P.length>0?A=P[P.length-1]:A=null,O!==null&&O.renderEnd()};function Xn(l,T,G,L){if(l.visible===!1)return;if(l.layers.test(T.layers)){if(l.isGroup)G=l.renderOrder;else if(l.isLOD)l.autoUpdate===!0&&l.update(T);else if(l.isLightProbeGrid)v.pushLightProbeGrid(l);else if(l.isLight)v.pushLight(l),l.castShadow&&v.pushShadow(l);else if(l.isSprite){if(!l.frustumCulled||ke.intersectsSprite(l)){L&&dt.setFromMatrixPosition(l.matrixWorld).applyMatrix4(st);const he=Y.update(l),fe=l.material;fe.visible&&A.push(l,he,fe,G,dt.z,null)}}else if((l.isMesh||l.isLine||l.isPoints)&&(!l.frustumCulled||ke.intersectsObject(l))){const he=Y.update(l),fe=l.material;if(L&&(l.boundingSphere!==void 0?(l.boundingSphere===null&&l.computeBoundingSphere(),dt.copy(l.boundingSphere.center)):(he.boundingSphere===null&&he.computeBoundingSphere(),dt.copy(he.boundingSphere.center)),dt.applyMatrix4(l.matrixWorld).applyMatrix4(st)),Array.isArray(fe)){const ge=he.groups;for(let xe=0,Pe=ge.length;xe<Pe;xe++){const Ue=ge[xe],Me=fe[Ue.materialIndex];Me&&Me.visible&&A.push(l,he,Me,G,dt.z,Ue)}}else fe.visible&&A.push(l,he,fe,G,dt.z,null)}}const ue=l.children;for(let he=0,fe=ue.length;he<fe;he++)Xn(ue[he],T,G,L)}function Li(l,T,G,L){const{opaque:U,transmissive:ue,transparent:he}=l;v.setupLightsView(G),He===!0&&Te.setGlobalState(y.clippingPlanes,G),L&&r.viewport(_e.copy(L)),U.length>0&&Rn(U,T,G),ue.length>0&&Rn(ue,T,G),he.length>0&&Rn(he,T,G),r.buffers.depth.setTest(!0),r.buffers.depth.setMask(!0),r.buffers.color.setMask(!0),r.setPolygonOffset(!1)}function wi(l,T,G,L){if((G.isScene===!0?G.overrideMaterial:null)!==null)return;if(v.state.transmissionRenderTarget[L.id]===void 0){const Me=We.has("EXT_color_buffer_half_float")||We.has("EXT_color_buffer_float");v.state.transmissionRenderTarget[L.id]=new Pt(1,1,{generateMipmaps:!0,type:Me?Bt:Rt,minFilter:ln,samples:Math.max(4,p.samples),stencilBuffer:o,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Je.workingColorSpace})}const ue=v.state.transmissionRenderTarget[L.id],he=L.viewport||_e;ue.setSize(he.z*y.transmissionResolutionScale,he.w*y.transmissionResolutionScale);const fe=y.getRenderTarget(),ge=y.getActiveCubeFace(),xe=y.getActiveMipmapLevel();y.setRenderTarget(ue),y.getClearColor(Qe),Be=y.getClearAlpha(),Be<1&&y.setClearColor(16777215,.5),y.clear(),et&&De.render(G);const Pe=y.toneMapping;y.toneMapping=Ot;const Ue=L.viewport;if(L.viewport!==void 0&&(L.viewport=void 0),v.setupLightsView(L),He===!0&&Te.setGlobalState(y.clippingPlanes,L),Rn(l,G,L),H.updateMultisampleRenderTarget(ue),H.updateRenderTargetMipmap(ue),We.has("WEBGL_multisampled_render_to_texture")===!1){let Me=!1;for(let ze=0,rt=T.length;ze<rt;ze++){const nt=T[ze],{object:Xe,geometry:gt,material:pe,group:Tt}=nt;if(pe.side===Ft&&Xe.layers.test(L.layers)){const Ge=pe.side;pe.side=At,pe.needsUpdate=!0,Ui(Xe,G,L,gt,pe,Tt),pe.side=Ge,pe.needsUpdate=!0,Me=!0}}Me===!0&&(H.updateMultisampleRenderTarget(ue),H.updateRenderTargetMipmap(ue))}y.setRenderTarget(fe,ge,xe),y.setClearColor(Qe,Be),Ue!==void 0&&(L.viewport=Ue),y.toneMapping=Pe}function Rn(l,T,G){const L=T.isScene===!0?T.overrideMaterial:null;for(let U=0,ue=l.length;U<ue;U++){const he=l[U],{object:fe,geometry:ge,group:xe}=he;let Pe=he.material;Pe.allowOverride===!0&&L!==null&&(Pe=L),fe.layers.test(G.layers)&&Ui(fe,T,G,ge,Pe,xe)}}function Ui(l,T,G,L,U,ue){l.onBeforeRender(y,T,G,L,U,ue),l.modelViewMatrix.multiplyMatrices(G.matrixWorldInverse,l.matrixWorld),l.normalMatrix.getNormalMatrix(l.modelViewMatrix),U.onBeforeRender(y,T,G,L,l,ue),U.transparent===!0&&U.side===Ft&&U.forceSinglePass===!1?(U.side=At,U.needsUpdate=!0,y.renderBufferDirect(G,T,L,U,l,ue),U.side=En,U.needsUpdate=!0,y.renderBufferDirect(G,T,L,U,l,ue),U.side=Ft):y.renderBufferDirect(G,T,L,U,l,ue),l.onAfterRender(y,T,G,L,U,ue)}function Cn(l,T,G){T.isScene!==!0&&(T=ht);const L=N.get(l),U=v.state.lights,ue=v.state.shadowsArray,he=U.state.version,fe=ae.getParameters(l,U.state,ue,T,G,v.state.lightProbeGridArray),ge=ae.getProgramCacheKey(fe);let xe=L.programs;L.environment=l.isMeshStandardMaterial||l.isMeshLambertMaterial||l.isMeshPhongMaterial?T.environment:null,L.fog=T.fog;const Pe=l.isMeshStandardMaterial||l.isMeshLambertMaterial&&!l.envMap||l.isMeshPhongMaterial&&!l.envMap;L.envMap=J.get(l.envMap||L.environment,Pe),L.envMapRotation=L.environment!==null&&l.envMap===null?T.environmentRotation:l.envMapRotation,xe===void 0&&(l.addEventListener("dispose",wt),xe=new Map,L.programs=xe);let Ue=xe.get(ge);if(Ue!==void 0){if(L.currentProgram===Ue&&L.lightsStateVersion===he)return Ni(l,fe),Ue}else fe.uniforms=ae.getUniforms(l),O!==null&&l.isNodeMaterial&&O.build(l,G,fe),l.onBeforeCompile(fe,y),Ue=ae.acquireProgram(fe,ge),xe.set(ge,Ue),L.uniforms=fe.uniforms;const Me=L.uniforms;return(!l.isShaderMaterial&&!l.isRawShaderMaterial||l.clipping===!0)&&(Me.clippingPlanes=Te.uniform),Ni(l,fe),L.needsLights=$r(l),L.lightsStateVersion=he,L.needsLights&&(Me.ambientLightColor.value=U.state.ambient,Me.lightProbe.value=U.state.probe,Me.directionalLights.value=U.state.directional,Me.directionalLightShadows.value=U.state.directionalShadow,Me.spotLights.value=U.state.spot,Me.spotLightShadows.value=U.state.spotShadow,Me.rectAreaLights.value=U.state.rectArea,Me.ltc_1.value=U.state.rectAreaLTC1,Me.ltc_2.value=U.state.rectAreaLTC2,Me.pointLights.value=U.state.point,Me.pointLightShadows.value=U.state.pointShadow,Me.hemisphereLights.value=U.state.hemi,Me.directionalShadowMatrix.value=U.state.directionalShadowMatrix,Me.spotLightMatrix.value=U.state.spotLightMatrix,Me.spotLightMap.value=U.state.spotLightMap,Me.pointShadowMatrix.value=U.state.pointShadowMatrix),L.lightProbeGrid=v.state.lightProbeGridArray.length>0,L.currentProgram=Ue,L.uniformsList=null,Ue}function Ii(l){if(l.uniformsList===null){const T=l.currentProgram.getUniforms();l.uniformsList=Gn.seqWithValue(T.seq,l.uniforms)}return l.uniformsList}function Ni(l,T){const G=N.get(l);G.outputColorSpace=T.outputColorSpace,G.batching=T.batching,G.batchingColor=T.batchingColor,G.instancing=T.instancing,G.instancingColor=T.instancingColor,G.instancingMorph=T.instancingMorph,G.skinning=T.skinning,G.morphTargets=T.morphTargets,G.morphNormals=T.morphNormals,G.morphColors=T.morphColors,G.morphTargetsCount=T.morphTargetsCount,G.numClippingPlanes=T.numClippingPlanes,G.numIntersection=T.numClipIntersection,G.vertexAlphas=T.vertexAlphas,G.vertexTangents=T.vertexTangents,G.toneMapping=T.toneMapping}function qr(l,T){if(l.length===0)return null;if(l.length===1)return l[0].texture!==null?l[0]:null;m.setFromMatrixPosition(T.matrixWorld);for(let G=0,L=l.length;G<L;G++){const U=l[G];if(U.texture!==null&&U.boundingBox.containsPoint(m))return U}return null}function Yr(l,T,G,L,U){T.isScene!==!0&&(T=ht),H.resetTextureUnits();const ue=T.fog,he=L.isMeshStandardMaterial||L.isMeshLambertMaterial||L.isMeshPhongMaterial?T.environment:null,fe=Z===null?y.outputColorSpace:Z.isXRRenderTarget===!0?Z.texture.colorSpace:Je.workingColorSpace,ge=L.isMeshStandardMaterial||L.isMeshLambertMaterial&&!L.envMap||L.isMeshPhongMaterial&&!L.envMap,xe=J.get(L.envMap||he,ge),Pe=L.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,Ue=!!G.attributes.tangent&&(!!L.normalMap||L.anisotropy>0),Me=!!G.morphAttributes.position,ze=!!G.morphAttributes.normal,rt=!!G.morphAttributes.color;let nt=Ot;L.toneMapped&&(Z===null||Z.isXRRenderTarget===!0)&&(nt=y.toneMapping);const Xe=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,gt=Xe!==void 0?Xe.length:0,pe=N.get(L),Tt=v.state.lights;if(He===!0&&(Fe===!0||l!==ce)){const $e=l===ce&&L.id===ee;Te.setState(L,l,$e)}let Ge=!1;L.version===pe.__version?(pe.needsLights&&pe.lightsStateVersion!==Tt.state.version||pe.outputColorSpace!==fe||U.isBatchedMesh&&pe.batching===!1||!U.isBatchedMesh&&pe.batching===!0||U.isBatchedMesh&&pe.batchingColor===!0&&U.colorTexture===null||U.isBatchedMesh&&pe.batchingColor===!1&&U.colorTexture!==null||U.isInstancedMesh&&pe.instancing===!1||!U.isInstancedMesh&&pe.instancing===!0||U.isSkinnedMesh&&pe.skinning===!1||!U.isSkinnedMesh&&pe.skinning===!0||U.isInstancedMesh&&pe.instancingColor===!0&&U.instanceColor===null||U.isInstancedMesh&&pe.instancingColor===!1&&U.instanceColor!==null||U.isInstancedMesh&&pe.instancingMorph===!0&&U.morphTexture===null||U.isInstancedMesh&&pe.instancingMorph===!1&&U.morphTexture!==null||pe.envMap!==xe||L.fog===!0&&pe.fog!==ue||pe.numClippingPlanes!==void 0&&(pe.numClippingPlanes!==Te.numPlanes||pe.numIntersection!==Te.numIntersection)||pe.vertexAlphas!==Pe||pe.vertexTangents!==Ue||pe.morphTargets!==Me||pe.morphNormals!==ze||pe.morphColors!==rt||pe.toneMapping!==nt||pe.morphTargetsCount!==gt||!!pe.lightProbeGrid!=v.state.lightProbeGridArray.length>0)&&(Ge=!0):(Ge=!0,pe.__version=L.version);let bt=pe.currentProgram;Ge===!0&&(bt=Cn(L,T,U),O&&L.isNodeMaterial&&O.onUpdateProgram(L,bt,pe));let Ut=!1,zt=!1,rn=!1;const qe=bt.getUniforms(),ot=pe.uniforms;if(r.useProgram(bt.program)&&(Ut=!0,zt=!0,rn=!0),L.id!==ee&&(ee=L.id,zt=!0),pe.needsLights){const $e=qr(v.state.lightProbeGridArray,U);pe.lightProbeGrid!==$e&&(pe.lightProbeGrid=$e,zt=!0)}if(Ut||ce!==l){r.buffers.depth.getReversed()&&l.reversedDepth!==!0&&(l._reversedDepth=!0,l.updateProjectionMatrix()),qe.setValue(x,"projectionMatrix",l.projectionMatrix),qe.setValue(x,"viewMatrix",l.matrixWorldInverse);const Xt=qe.map.cameraPosition;Xt!==void 0&&Xt.setValue(x,ct.setFromMatrixPosition(l.matrixWorld)),p.logarithmicDepthBuffer&&qe.setValue(x,"logDepthBufFC",2/(Math.log(l.far+1)/Math.LN2)),(L.isMeshPhongMaterial||L.isMeshToonMaterial||L.isMeshLambertMaterial||L.isMeshBasicMaterial||L.isMeshStandardMaterial||L.isShaderMaterial)&&qe.setValue(x,"isOrthographic",l.isOrthographicCamera===!0),ce!==l&&(ce=l,zt=!0,rn=!0)}if(pe.needsLights&&(Tt.state.directionalShadowMap.length>0&&qe.setValue(x,"directionalShadowMap",Tt.state.directionalShadowMap,H),Tt.state.spotShadowMap.length>0&&qe.setValue(x,"spotShadowMap",Tt.state.spotShadowMap,H),Tt.state.pointShadowMap.length>0&&qe.setValue(x,"pointShadowMap",Tt.state.pointShadowMap,H)),U.isSkinnedMesh){qe.setOptional(x,U,"bindMatrix"),qe.setOptional(x,U,"bindMatrixInverse");const $e=U.skeleton;$e&&($e.boneTexture===null&&$e.computeBoneTexture(),qe.setValue(x,"boneTexture",$e.boneTexture,H))}U.isBatchedMesh&&(qe.setOptional(x,U,"batchingTexture"),qe.setValue(x,"batchingTexture",U._matricesTexture,H),qe.setOptional(x,U,"batchingIdTexture"),qe.setValue(x,"batchingIdTexture",U._indirectTexture,H),qe.setOptional(x,U,"batchingColorTexture"),U._colorsTexture!==null&&qe.setValue(x,"batchingColorTexture",U._colorsTexture,H));const kt=G.morphAttributes;if((kt.position!==void 0||kt.normal!==void 0||kt.color!==void 0)&&E.update(U,G,bt),(zt||pe.receiveShadow!==U.receiveShadow)&&(pe.receiveShadow=U.receiveShadow,qe.setValue(x,"receiveShadow",U.receiveShadow)),(L.isMeshStandardMaterial||L.isMeshLambertMaterial||L.isMeshPhongMaterial)&&L.envMap===null&&T.environment!==null&&(ot.envMapIntensity.value=T.environmentIntensity),ot.dfgLUT!==void 0&&(ot.dfgLUT.value=Ed()),zt){if(qe.setValue(x,"toneMappingExposure",y.toneMappingExposure),pe.needsLights&&Kr(ot,rn),ue&&L.fog===!0&&Ee.refreshFogUniforms(ot,ue),Ee.refreshMaterialUniforms(ot,L,Q,ne,v.state.transmissionRenderTarget[l.id]),pe.needsLights&&pe.lightProbeGrid){const $e=pe.lightProbeGrid;ot.probesSH.value=$e.texture,ot.probesMin.value.copy($e.boundingBox.min),ot.probesMax.value.copy($e.boundingBox.max),ot.probesResolution.value.copy($e.resolution)}Gn.upload(x,Ii(pe),ot,H)}if(L.isShaderMaterial&&L.uniformsNeedUpdate===!0&&(Gn.upload(x,Ii(pe),ot,H),L.uniformsNeedUpdate=!1),L.isSpriteMaterial&&qe.setValue(x,"center",U.center),qe.setValue(x,"modelViewMatrix",U.modelViewMatrix),qe.setValue(x,"normalMatrix",U.normalMatrix),qe.setValue(x,"modelMatrix",U.matrixWorld),L.uniformsGroups!==void 0){const $e=L.uniformsGroups;for(let Xt=0,on=$e.length;Xt<on;Xt++){const yi=$e[Xt];$.update(yi,bt),$.bind(yi,bt)}}return bt}function Kr(l,T){l.ambientLightColor.needsUpdate=T,l.lightProbe.needsUpdate=T,l.directionalLights.needsUpdate=T,l.directionalLightShadows.needsUpdate=T,l.pointLights.needsUpdate=T,l.pointLightShadows.needsUpdate=T,l.spotLights.needsUpdate=T,l.spotLightShadows.needsUpdate=T,l.rectAreaLights.needsUpdate=T,l.hemisphereLights.needsUpdate=T}function $r(l){return l.isMeshLambertMaterial||l.isMeshToonMaterial||l.isMeshPhongMaterial||l.isMeshStandardMaterial||l.isShadowMaterial||l.isShaderMaterial&&l.lights===!0}this.getActiveCubeFace=function(){return q},this.getActiveMipmapLevel=function(){return V},this.getRenderTarget=function(){return Z},this.setRenderTargetTextures=function(l,T,G){const L=N.get(l);L.__autoAllocateDepthBuffer=l.resolveDepthBuffer===!1,L.__autoAllocateDepthBuffer===!1&&(L.__useRenderToTexture=!1),N.get(l.texture).__webglTexture=T,N.get(l.depthTexture).__webglTexture=L.__autoAllocateDepthBuffer?void 0:G,L.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(l,T){const G=N.get(l);G.__webglFramebuffer=T,G.__useDefaultFramebuffer=T===void 0},this.setRenderTarget=function(l,T=0,G=0){Z=l,q=T,V=G;let L=null,U=!1,ue=!1;if(l){const fe=N.get(l);if(fe.__useDefaultFramebuffer!==void 0){r.bindFramebuffer(x.FRAMEBUFFER,fe.__webglFramebuffer),_e.copy(l.viewport),ve.copy(l.scissor),Oe=l.scissorTest,r.viewport(_e),r.scissor(ve),r.setScissorTest(Oe),ee=-1;return}else if(fe.__webglFramebuffer===void 0)H.setupRenderTarget(l);else if(fe.__hasExternalTextures)H.rebindTextures(l,N.get(l.texture).__webglTexture,N.get(l.depthTexture).__webglTexture);else if(l.depthBuffer){const Pe=l.depthTexture;if(fe.__boundDepthTexture!==Pe){if(Pe!==null&&N.has(Pe)&&(l.width!==Pe.image.width||l.height!==Pe.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");H.setupDepthRenderbuffer(l)}}const ge=l.texture;(ge.isData3DTexture||ge.isDataArrayTexture||ge.isCompressedArrayTexture)&&(ue=!0);const xe=N.get(l).__webglFramebuffer;l.isWebGLCubeRenderTarget?(Array.isArray(xe[T])?L=xe[T][G]:L=xe[T],U=!0):l.samples>0&&H.useMultisampledRTT(l)===!1?L=N.get(l).__webglMultisampledFramebuffer:Array.isArray(xe)?L=xe[G]:L=xe,_e.copy(l.viewport),ve.copy(l.scissor),Oe=l.scissorTest}else _e.copy(Ae).multiplyScalar(Q).floor(),ve.copy(at).multiplyScalar(Q).floor(),Oe=Ne;if(G!==0&&(L=j),r.bindFramebuffer(x.FRAMEBUFFER,L)&&r.drawBuffers(l,L),r.viewport(_e),r.scissor(ve),r.setScissorTest(Oe),U){const fe=N.get(l.texture);x.framebufferTexture2D(x.FRAMEBUFFER,x.COLOR_ATTACHMENT0,x.TEXTURE_CUBE_MAP_POSITIVE_X+T,fe.__webglTexture,G)}else if(ue){const fe=T;for(let ge=0;ge<l.textures.length;ge++){const xe=N.get(l.textures[ge]);x.framebufferTextureLayer(x.FRAMEBUFFER,x.COLOR_ATTACHMENT0+ge,xe.__webglTexture,G,fe)}}else if(l!==null&&G!==0){const fe=N.get(l.texture);x.framebufferTexture2D(x.FRAMEBUFFER,x.COLOR_ATTACHMENT0,x.TEXTURE_2D,fe.__webglTexture,G)}ee=-1},this.readRenderTargetPixels=function(l,T,G,L,U,ue,he,fe=0){if(!(l&&l.isWebGLRenderTarget)){je("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ge=N.get(l).__webglFramebuffer;if(l.isWebGLCubeRenderTarget&&he!==void 0&&(ge=ge[he]),ge){r.bindFramebuffer(x.FRAMEBUFFER,ge);try{const xe=l.textures[fe],Pe=xe.format,Ue=xe.type;if(l.textures.length>1&&x.readBuffer(x.COLOR_ATTACHMENT0+fe),!p.textureFormatReadable(Pe)){je("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!p.textureTypeReadable(Ue)){je("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}T>=0&&T<=l.width-L&&G>=0&&G<=l.height-U&&x.readPixels(T,G,L,U,oe.convert(Pe),oe.convert(Ue),ue)}finally{const xe=Z!==null?N.get(Z).__webglFramebuffer:null;r.bindFramebuffer(x.FRAMEBUFFER,xe)}}},this.readRenderTargetPixelsAsync=async function(l,T,G,L,U,ue,he,fe=0){if(!(l&&l.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ge=N.get(l).__webglFramebuffer;if(l.isWebGLCubeRenderTarget&&he!==void 0&&(ge=ge[he]),ge)if(T>=0&&T<=l.width-L&&G>=0&&G<=l.height-U){r.bindFramebuffer(x.FRAMEBUFFER,ge);const xe=l.textures[fe],Pe=xe.format,Ue=xe.type;if(l.textures.length>1&&x.readBuffer(x.COLOR_ATTACHMENT0+fe),!p.textureFormatReadable(Pe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!p.textureTypeReadable(Ue))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Me=x.createBuffer();x.bindBuffer(x.PIXEL_PACK_BUFFER,Me),x.bufferData(x.PIXEL_PACK_BUFFER,ue.byteLength,x.STREAM_READ),x.readPixels(T,G,L,U,oe.convert(Pe),oe.convert(Ue),0);const ze=Z!==null?N.get(Z).__webglFramebuffer:null;r.bindFramebuffer(x.FRAMEBUFFER,ze);const rt=x.fenceSync(x.SYNC_GPU_COMMANDS_COMPLETE,0);return x.flush(),await to(x,rt,4),x.bindBuffer(x.PIXEL_PACK_BUFFER,Me),x.getBufferSubData(x.PIXEL_PACK_BUFFER,0,ue),x.deleteBuffer(Me),x.deleteSync(rt),ue}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(l,T=null,G=0){const L=Math.pow(2,-G),U=Math.floor(l.image.width*L),ue=Math.floor(l.image.height*L),he=T!==null?T.x:0,fe=T!==null?T.y:0;H.setTexture2D(l,0),x.copyTexSubImage2D(x.TEXTURE_2D,G,0,0,he,fe,U,ue),r.unbindTexture()},this.copyTextureToTexture=function(l,T,G=null,L=null,U=0,ue=0){let he,fe,ge,xe,Pe,Ue,Me,ze,rt;const nt=l.isCompressedTexture?l.mipmaps[ue]:l.image;if(G!==null)he=G.max.x-G.min.x,fe=G.max.y-G.min.y,ge=G.isBox3?G.max.z-G.min.z:1,xe=G.min.x,Pe=G.min.y,Ue=G.isBox3?G.min.z:0;else{const ot=Math.pow(2,-U);he=Math.floor(nt.width*ot),fe=Math.floor(nt.height*ot),l.isDataArrayTexture?ge=nt.depth:l.isData3DTexture?ge=Math.floor(nt.depth*ot):ge=1,xe=0,Pe=0,Ue=0}L!==null?(Me=L.x,ze=L.y,rt=L.z):(Me=0,ze=0,rt=0);const Xe=oe.convert(T.format),gt=oe.convert(T.type);let pe;T.isData3DTexture?(H.setTexture3D(T,0),pe=x.TEXTURE_3D):T.isDataArrayTexture||T.isCompressedArrayTexture?(H.setTexture2DArray(T,0),pe=x.TEXTURE_2D_ARRAY):(H.setTexture2D(T,0),pe=x.TEXTURE_2D),r.activeTexture(x.TEXTURE0),r.pixelStorei(x.UNPACK_FLIP_Y_WEBGL,T.flipY),r.pixelStorei(x.UNPACK_PREMULTIPLY_ALPHA_WEBGL,T.premultiplyAlpha),r.pixelStorei(x.UNPACK_ALIGNMENT,T.unpackAlignment);const Tt=r.getParameter(x.UNPACK_ROW_LENGTH),Ge=r.getParameter(x.UNPACK_IMAGE_HEIGHT),bt=r.getParameter(x.UNPACK_SKIP_PIXELS),Ut=r.getParameter(x.UNPACK_SKIP_ROWS),zt=r.getParameter(x.UNPACK_SKIP_IMAGES);r.pixelStorei(x.UNPACK_ROW_LENGTH,nt.width),r.pixelStorei(x.UNPACK_IMAGE_HEIGHT,nt.height),r.pixelStorei(x.UNPACK_SKIP_PIXELS,xe),r.pixelStorei(x.UNPACK_SKIP_ROWS,Pe),r.pixelStorei(x.UNPACK_SKIP_IMAGES,Ue);const rn=l.isDataArrayTexture||l.isData3DTexture,qe=T.isDataArrayTexture||T.isData3DTexture;if(l.isDepthTexture){const ot=N.get(l),kt=N.get(T),$e=N.get(ot.__renderTarget),Xt=N.get(kt.__renderTarget);r.bindFramebuffer(x.READ_FRAMEBUFFER,$e.__webglFramebuffer),r.bindFramebuffer(x.DRAW_FRAMEBUFFER,Xt.__webglFramebuffer);for(let on=0;on<ge;on++)rn&&(x.framebufferTextureLayer(x.READ_FRAMEBUFFER,x.COLOR_ATTACHMENT0,N.get(l).__webglTexture,U,Ue+on),x.framebufferTextureLayer(x.DRAW_FRAMEBUFFER,x.COLOR_ATTACHMENT0,N.get(T).__webglTexture,ue,rt+on)),x.blitFramebuffer(xe,Pe,he,fe,Me,ze,he,fe,x.DEPTH_BUFFER_BIT,x.NEAREST);r.bindFramebuffer(x.READ_FRAMEBUFFER,null),r.bindFramebuffer(x.DRAW_FRAMEBUFFER,null)}else if(U!==0||l.isRenderTargetTexture||N.has(l)){const ot=N.get(l),kt=N.get(T);r.bindFramebuffer(x.READ_FRAMEBUFFER,K),r.bindFramebuffer(x.DRAW_FRAMEBUFFER,z);for(let $e=0;$e<ge;$e++)rn?x.framebufferTextureLayer(x.READ_FRAMEBUFFER,x.COLOR_ATTACHMENT0,ot.__webglTexture,U,Ue+$e):x.framebufferTexture2D(x.READ_FRAMEBUFFER,x.COLOR_ATTACHMENT0,x.TEXTURE_2D,ot.__webglTexture,U),qe?x.framebufferTextureLayer(x.DRAW_FRAMEBUFFER,x.COLOR_ATTACHMENT0,kt.__webglTexture,ue,rt+$e):x.framebufferTexture2D(x.DRAW_FRAMEBUFFER,x.COLOR_ATTACHMENT0,x.TEXTURE_2D,kt.__webglTexture,ue),U!==0?x.blitFramebuffer(xe,Pe,he,fe,Me,ze,he,fe,x.COLOR_BUFFER_BIT,x.NEAREST):qe?x.copyTexSubImage3D(pe,ue,Me,ze,rt+$e,xe,Pe,he,fe):x.copyTexSubImage2D(pe,ue,Me,ze,xe,Pe,he,fe);r.bindFramebuffer(x.READ_FRAMEBUFFER,null),r.bindFramebuffer(x.DRAW_FRAMEBUFFER,null)}else qe?l.isDataTexture||l.isData3DTexture?x.texSubImage3D(pe,ue,Me,ze,rt,he,fe,ge,Xe,gt,nt.data):T.isCompressedArrayTexture?x.compressedTexSubImage3D(pe,ue,Me,ze,rt,he,fe,ge,Xe,nt.data):x.texSubImage3D(pe,ue,Me,ze,rt,he,fe,ge,Xe,gt,nt):l.isDataTexture?x.texSubImage2D(x.TEXTURE_2D,ue,Me,ze,he,fe,Xe,gt,nt.data):l.isCompressedTexture?x.compressedTexSubImage2D(x.TEXTURE_2D,ue,Me,ze,nt.width,nt.height,Xe,nt.data):x.texSubImage2D(x.TEXTURE_2D,ue,Me,ze,he,fe,Xe,gt,nt);r.pixelStorei(x.UNPACK_ROW_LENGTH,Tt),r.pixelStorei(x.UNPACK_IMAGE_HEIGHT,Ge),r.pixelStorei(x.UNPACK_SKIP_PIXELS,bt),r.pixelStorei(x.UNPACK_SKIP_ROWS,Ut),r.pixelStorei(x.UNPACK_SKIP_IMAGES,zt),ue===0&&T.generateMipmaps&&x.generateMipmap(pe),r.unbindTexture()},this.initRenderTarget=function(l){N.get(l).__webglFramebuffer===void 0&&H.setupRenderTarget(l)},this.initTexture=function(l){l.isCubeTexture?H.setTextureCube(l,0):l.isData3DTexture?H.setTexture3D(l,0):l.isDataArrayTexture||l.isCompressedArrayTexture?H.setTexture2DArray(l,0):H.setTexture2D(l,0),r.unbindTexture()},this.resetState=function(){q=0,V=0,Z=null,r.reset(),de.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Gi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(n){this._outputColorSpace=n;const t=this.getContext();t.drawingBufferColorSpace=Je._getDrawingBufferColorSpace(n),t.unpackColorSpace=Je._getUnpackColorSpace()}}const xd=2,Xa=2048,qa=4,Md=/^#[0-9a-fA-F]{6}$/,Ya=1e5,Ka=64,$a=5e6;function Td(e){if(e.instanceCount>Ya)throw new Error(`instanceCount must not exceed ${Ya}.`);if(e.geometry.variantCount>Ka)throw new Error(`variantCount must not exceed ${Ka}.`);if(e.geometry.variantCount>e.instanceCount)throw new Error("variantCount must not exceed instanceCount.");if(e.instanceCount*e.geometry.bladesPerClump*e.geometry.bladeSegments>$a)throw new Error(`Configured near-grass workload must not exceed ${$a}.`);if(e.geometry.bladesPerClump<3)throw new Error("bladesPerClump must be at least 3.");if(e.geometry.bladeSegments<2)throw new Error("bladeSegments must be at least 2.");if(e.geometry.midBladesPerClump<2)throw new Error("midBladesPerClump must be at least 2.");if(e.geometry.midBladeSegments<1)throw new Error("midBladeSegments must be at least 1.");if(e.geometry.midBladesPerClump>e.geometry.bladesPerClump)throw new Error("midBladesPerClump must not exceed bladesPerClump.");if(e.geometry.midBladeSegments>=e.geometry.bladeSegments)throw new Error("midBladeSegments must be lower than bladeSegments.");if(e.geometry.bladeHeightMin>e.geometry.bladeHeightMax)throw new Error("bladeHeightMin must be less than or equal to bladeHeightMax.");if(e.geometry.bladeWidthMin>e.geometry.bladeWidthMax)throw new Error("bladeWidthMin must be less than or equal to bladeWidthMax.");if(e.geometry.bladeLeanMin>e.geometry.bladeLeanMax)throw new Error("bladeLeanMin must be less than or equal to bladeLeanMax.");if(e.distribution.densityMin>e.distribution.densityMax)throw new Error("densityMin must be less than or equal to densityMax.");if(e.lod.nearMaxDistance>=e.lod.midMaxDistance||e.lod.midMaxDistance>=e.lod.farMaxDistance)throw new Error("Grass LOD distances must increase from near to far.");if(e.lod.transitionDistance>=e.lod.nearMaxDistance)throw new Error("transitionDistance must be lower than nearMaxDistance.");if(e.lod.hysteresisDistance>=e.lod.nearMaxDistance-e.lod.transitionDistance)throw new Error("hysteresisDistance is too large for the near LOD band.");if(Math.hypot(e.wind.directionX,e.wind.directionZ)<Number.EPSILON)throw new Error("Grass wind direction must not be zero.");for(const[t,i]of[["baseColor",e.material.baseColor],["tipColor",e.material.tipColor],["dryColor",e.material.dryColor]])if(!Md.test(i))throw new Error(`Grass config value ${t} must be a six-digit hex color.`);if(e.impostor.viewsPerAxis<2)throw new Error("impostorViewsPerAxis must be at least 2.");if(e.impostor.viewsPerAxis>16)throw new Error("impostorViewsPerAxis must not exceed 16.");if(e.impostor.frameResolution<32)throw new Error("impostorFrameResolution must be at least 32.");if(e.impostor.padding<qa)throw new Error(`impostorPadding must be at least ${qa} pixels for mip-safe atlas isolation.`);if((e.impostor.frameResolution+e.impostor.padding*2)*e.impostor.viewsPerAxis*xd>Xa)throw new Error(`Impostor atlas size must not exceed ${Xa} pixels.`);if(e.impostor.cameraMargin<1)throw new Error("impostorCameraMargin must be at least 1.")}const Ad="./config/grass.yaml";function bd(){return`${Ad}?v=${encodeURIComponent("v0.9.6+ca1d28ea14c2")}`}class lh{async load(n=bd()){const t=await fetch(n);if(!t.ok)throw new Error(`Unable to load grass config from ${n}: HTTP ${t.status}`);return this.parse(await t.text())}parse(n){const t=Es.parse(n,"grass"),i=new xs(t,"Grass"),a={instanceCount:i.number("instanceCount",qt),patchSize:i.number("patchSize",mt),geometry:{variantCount:i.number("variantCount",qt),bladesPerClump:i.number("bladesPerClump",qt),bladeSegments:i.number("bladeSegments",qt),clumpRadius:i.number("clumpRadius",mt),bladeHeightMin:i.number("bladeHeightMin",mt),bladeHeightMax:i.number("bladeHeightMax",mt),bladeWidthMin:i.number("bladeWidthMin",mt),bladeWidthMax:i.number("bladeWidthMax",mt),bladeLeanMin:i.number("bladeLeanMin",It),bladeLeanMax:i.number("bladeLeanMax",It),bladeCurve:i.number("bladeCurve",{minimum:0,maximum:1.2}),midBladesPerClump:i.number("midBladesPerClump",qt),midBladeSegments:i.number("midBladeSegments",qt),midRadiusScale:i.number("midRadiusScale",mt),midHeightScale:i.number("midHeightScale",mt),midWidthScale:i.number("midWidthScale",mt),midLeanScale:i.number("midLeanScale",It)},distribution:{seed:i.number("seed",Ts),rootSink:i.number("rootSink",It),maxSlopeDegrees:i.number("maxSlopeDegrees",{minimum:0,maximum:89}),heightVariation:i.number("heightVariation",{minimum:0,maximum:.95}),widthVariation:i.number("widthVariation",{minimum:0,maximum:.95}),densityMin:i.number("densityMin",{minimum:0,maximum:1}),densityMax:i.number("densityMax",{minimum:0,maximum:1}),densityScale:i.number("densityScale",mt)},wind:{directionX:i.number("windDirectionX"),directionZ:i.number("windDirectionZ"),strength:i.number("windStrength",It),gustScale:i.number("gustScale",mt),gustSpeed:i.number("gustSpeed",It),flutterStrength:i.number("flutterStrength",It),flutterSpeed:i.number("flutterSpeed",It)},material:{baseColor:i.string("baseColor"),tipColor:i.string("tipColor"),dryColor:i.string("dryColor"),rootDarkening:i.number("rootDarkening",{minimum:0,maximum:1}),normalUp:i.number("normalUp",{minimum:0,maximum:1}),ambientBoost:i.number("ambientBoost",{minimum:0,maximum:1}),backlightStrength:i.number("backlightStrength",{minimum:0,maximum:1})},lod:{nearMaxDistance:i.number("nearMaxDistance",mt),midMaxDistance:i.number("midMaxDistance",mt),farMaxDistance:i.number("farMaxDistance",mt),hysteresisDistance:i.number("hysteresisDistance",It),transitionDistance:i.number("transitionDistance",mt)},qa:{warmupSeconds:i.number("qaWarmupSeconds",It),sampleSeconds:i.number("qaSampleSeconds",mt)},impostor:{viewsPerAxis:i.number("impostorViewsPerAxis",qt),frameResolution:i.number("impostorFrameResolution",qt),padding:i.number("impostorPadding",Ms),cameraMargin:i.number("impostorCameraMargin",mt)}};return t.assertFullyConsumed(),Td(a),Object.freeze({...a,geometry:Object.freeze(a.geometry),distribution:Object.freeze(a.distribution),wind:Object.freeze(a.wind),material:Object.freeze(a.material),lod:Object.freeze(a.lod),qa:Object.freeze(a.qa),impostor:Object.freeze(a.impostor)})}}class Rd{constructor(n){Le(this,"state");this.state=n>>>0}next(){this.state=this.state+1831565813>>>0;let n=this.state;return n=Math.imul(n^n>>>15,n|1),n^=n+Math.imul(n^n>>>7,n|61),((n^n>>>14)>>>0)/4294967296}range(n,t){return n+(t-n)*this.next()}}const Cd=Math.PI*2,Za=2654435769,Dd=1e-4;function ja(e,n,t){const i=Dt.clamp(t,0,1);if(!(n>Dd))return{y:e*i,z:0};const a=i*i,o=n*a,s=e/n;return{y:s*Math.sin(o),z:s*(1-Math.cos(o))}}class ch{createLodVariants(n,t){const i={bladesPerClump:n.midBladesPerClump,bladeSegments:n.midBladeSegments,clumpRadius:n.clumpRadius*n.midRadiusScale,bladeHeightMin:n.bladeHeightMin*n.midHeightScale,bladeHeightMax:n.bladeHeightMax*n.midHeightScale,bladeWidthMin:n.bladeWidthMin*n.midWidthScale,bladeWidthMax:n.bladeWidthMax*n.midWidthScale,bladeLeanMin:n.bladeLeanMin*n.midLeanScale,bladeLeanMax:n.bladeLeanMax*n.midLeanScale,bladeCurve:n.bladeCurve};return{near:this.createVariants(n,n.variantCount,t),mid:this.createVariants(i,n.variantCount,t^Za)}}createInstancedGeometry(n,t,i,a,o){var g,F;const s=new gs;n.index&&s.setIndex(n.index);for(const[C,h]of Object.entries(n.attributes))s.setAttribute(C,h);s.setAttribute("instanceVariation",(a==null?void 0:a.variation)??new ei(t,4));const d=t.length/4,M=i??new Float32Array(d).fill(1);return s.setAttribute("instanceCoverage",(a==null?void 0:a.coverage)??new ei(M,1)),s.setAttribute("instanceBiome",(a==null?void 0:a.biome)??new ei(o??new Float32Array(d),1)),s.boundingBox=((g=n.boundingBox)==null?void 0:g.clone())??null,s.boundingSphere=((F=n.boundingSphere)==null?void 0:F.clone())??null,s}disposeInstancedMesh(n,t=!1){const i=n.geometry;for(const a of Object.keys(i.attributes))(t||a!=="instanceVariation"&&a!=="instanceCoverage"&&a!=="instanceBiome")&&i.deleteAttribute(a);i.setIndex(null),i.dispose(),t||n.dispose()}createVariants(n,t,i){return Array.from({length:t},(a,o)=>this.createClump(n,i+o*Za))}createClump(n,t){const i=new Rd(t),a=[],o=[],s=[],d=[],M=[],g=[];for(let C=0;C<n.bladesPerClump;C+=1){const h=i.range(0,Cd),S=Math.sqrt(i.next())*n.clumpRadius,R=Math.cos(h)*S,B=Math.sin(h)*S,u=h+i.range(-.85,.85),c=Math.cos(u)*.5,w=Math.sin(u)*.5,I=-Math.sin(u),m=Math.cos(u),A=h+i.range(-.65,.65),v=i.range(n.bladeLeanMin,n.bladeLeanMax),P=Math.cos(A)*v,f=Math.sin(A)*v,_=i.range(n.bladeHeightMin,n.bladeHeightMax),y=i.range(n.bladeWidthMin,n.bladeWidthMax),D=i.next(),O=i.next(),j=a.length/3;for(let ee=0;ee<n.bladeSegments;ee+=1){const ce=ee/n.bladeSegments,_e=ce*ce*(3-2*ce),ve=Math.pow(1-ce,.72),Oe=y*ve,Qe=ja(_,n.bladeCurve,ce),Be=R+P*_e+I*Qe.z,k=B+f*_e+m*Qe.z;a.push(Be-c*Oe,Qe.y,k-w*Oe,Be+c*Oe,Qe.y,k+w*Oe),o.push(0,ce,1,ce),s.push(ce,ce),d.push(D,D),M.push(O,O)}const K=ja(_,n.bladeCurve,1),z=R+P+I*K.z,q=B+f+m*K.z,V=a.length/3;a.push(z,K.y,q),o.push(.5,1),s.push(1),d.push(D),M.push(O);for(let ee=0;ee<n.bladeSegments-1;ee+=1){const ce=j+ee*2;g.push(ce,ce+2,ce+1,ce+2,ce+3,ce+1)}const Z=j+(n.bladeSegments-1)*2;g.push(Z,V,Z+1)}const F=new bn;return F.setAttribute("position",new jt(a,3)),F.setAttribute("uv",new jt(o,2)),F.setAttribute("grassProgress",new jt(s,1)),F.setAttribute("grassPhase",new jt(d,1)),F.setAttribute("grassBladeShade",new jt(M,1)),F.setIndex(g),F.computeVertexNormals(),F.computeBoundingBox(),F.computeBoundingSphere(),F}}const Pd=0,fh=1.12,uh=1.1,dh=1.2,ph=.35,Qa=.12,hh=.08,mh=.15;var vt=(e=>(e[e.Near=0]="Near",e[e.Mid=1]="Mid",e[e.Far=2]="Far",e[e.Terrain=3]="Terrain",e))(vt||{});class _h{constructor(n){Le(this,"patches",new Map);this.patchSize=n}keyFor(n){return this.key(Math.floor(n.x/this.patchSize),Math.floor(n.z/this.patchSize))}coordinatesFor(n){return[Math.floor(n.x/this.patchSize),Math.floor(n.z/this.patchSize)]}register(n){if(this.patches.has(n.id))throw new Error(`Grass patch ${n.id} is already registered.`);this.patches.set(n.id,n)}values(){return this.patches.values()}clear(){this.patches.clear()}key(n,t){return`${n}:${t}`}}const si=.001,Ld=1/1024,Ja=3,wd=4;function Ud(e,n){let t=0,i=e.length;for(;t<i;){const a=t+i>>>1;e[a]>n?t=a+1:i=a}return t}class gh{constructor(n){Le(this,"cameraPosition",new Ie);Le(this,"closestPoint",new Ie);Le(this,"projectionViewMatrix",new tn);Le(this,"frustum",new xi);Le(this,"midFalloff",{start:0,end:1,floor:1,scale:1});Le(this,"submittedMidVertices",0);Le(this,"submittedFarInstances",0);Le(this,"midInstanceRadius",wd);Le(this,"matrixSwap",new Float32Array(16));Le(this,"variationSwap",new Float32Array(4));this.config=n}setMidDensityFalloff(n){this.midFalloff=n}setMidInstanceRadius(n){Number.isFinite(n)&&n>0&&(this.midInstanceRadius=n)}update(n,t){n.updateMatrixWorld(),n.getWorldPosition(this.cameraPosition),this.projectionViewMatrix.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this.frustum.setFromProjectionMatrix(this.projectionViewMatrix),this.submittedMidVertices=0;const i=this.config.farMaxDistance+this.config.transitionDistance;for(const a of t){if(a.bounds.clampPoint(this.cameraPosition,this.closestPoint),a.distance=this.cameraPosition.distanceTo(this.closestPoint),a.distance>=i){a.inFrustum=!1,a.nearMesh&&(a.nearMesh.visible=!1),a.midMesh.visible=!1,a.farMesh&&(a.farMesh.visible=!1);continue}a.inFrustum=this.frustum.intersectsBox(a.bounds),a.farMesh||a.hasFarImpostor?this.updateThreeStagePatch(a):this.updateLegacyPatch(a)}}updateFarGroups(n){const t=this.config.farMaxDistance+this.config.transitionDistance,i=this.config.midMaxDistance-this.config.transitionDistance;this.submittedFarInstances=0;for(const a of n){if(a.bounds.clampPoint(this.cameraPosition,this.closestPoint),a.distance=this.cameraPosition.distanceTo(this.closestPoint),a.distance>=t){a.inFrustum=!1,a.mesh.visible=!1;continue}if(a.inFrustum=this.frustum.intersectsBox(a.bounds),!a.inFrustum){a.mesh.visible=!1;continue}const o=this.cameraPosition.distanceTo(a.boundingSphere.center)+a.boundingSphere.radius;a.mesh.visible=o>i,a.mesh.visible&&(this.submittedFarInstances+=a.mesh.count)}}getSubmittedMidVertices(){return this.submittedMidVertices}getSubmittedFarInstances(){return this.submittedFarInstances}updateThreeStagePatch(n){n.lod=this.resolveLevel(n.distance,n.lod,!0),n.nearCoverage=this.resolveNearCoverage(n.distance);const t=this.resolveFarEntry(n.distance);if(n.midCoverage=Math.max(0,(1-n.nearCoverage)*(1-t)),n.farCoverage=this.resolveFarCoverage(n.distance,n.nearCoverage,t),!n.inFrustum){n.nearMesh&&(n.nearMesh.visible=!1),n.midMesh.visible=!1,n.farMesh&&(n.farMesh.visible=!1);return}const i=this.cameraPosition.distanceTo(n.boundingSphere.center)+n.boundingSphere.radius,a=this.config.nearMaxDistance-this.config.transitionDistance,o=this.config.nearMaxDistance+this.config.transitionDistance,s=this.config.midMaxDistance-this.config.transitionDistance,d=this.config.midMaxDistance+this.config.transitionDistance,M=this.config.farMaxDistance+this.config.transitionDistance;n.nearMesh&&(n.nearMesh.visible=n.distance<o),n.midMesh.visible=i>a&&n.distance<d,n.midMesh.visible&&(this.compactMidInstances(n,a)===0?n.midMesh.visible=!1:this.trimMidDraw(n,i)),n.farMesh&&(n.farMesh.visible=i>s&&n.distance<M)}trimMidDraw(n,t){const i=n.midSortedDithers;if(!i)return;const a=this.resolveNearCoverage(t),o=this.resolveFarEntry(n.distance),s=Math.max(a,o),M=1-this.midFalloff.scale*Dt.lerp(1,this.midFalloff.floor,Dt.smoothstep(n.distance,this.midFalloff.start,this.midFalloff.end))*(1-s)-Ld,g=M<=0?i.length:Ud(i,M);n.midMesh.geometry.setDrawRange(0,g*Ja),this.submittedMidVertices+=g*Ja*n.midMesh.count}compactMidInstances(n,t){const i=n.midMesh,a=n.instanceCount;if(a<=0)return i.count=0,0;const o=i.instanceMatrix.array,s=i.geometry.getAttribute("instanceVariation"),d=i.geometry.getAttribute("instanceCoverage"),M=i.geometry.getAttribute("instanceBiome");if(!s||!d||!M)return i.count=a,a;const g=s.array,F=d.array,C=M.array,h=n.baseMidCoverage,S=i.position,R=this.cameraPosition,B=this.midInstanceRadius;let u=0;for(let c=0;c<a;c+=1){const w=c*16,I=S.x+o[w+12]-R.x,m=S.y+o[w+13]-R.y,A=S.z+o[w+14]-R.z;Math.hypot(I,m,A)+B<=t||(u!==c&&(er(o,u*16,w,16,this.matrixSwap),er(g,u*4,c*4,4,this.variationSwap),li(F,u,c),li(C,u,c),h&&li(h,u,c)),u+=1)}return u!==i.count&&(i.count=u),u>0&&u<a&&(i.instanceMatrix.needsUpdate=!0,s.needsUpdate=!0,d.needsUpdate=!0,M.needsUpdate=!0),u}updateLegacyPatch(n){const t=n.nearMesh;if(t){if(n.lod=this.resolveLevel(n.distance,n.lod,!1),n.nearCoverage=this.resolveNearCoverage(n.distance),n.midDistanceFade=this.resolveLegacyMidDistanceFade(n.distance),!n.inFrustum){t.visible=!1,n.midMesh.visible=!1;return}t.visible=n.nearCoverage>si,n.midMesh.visible=n.nearCoverage<1-si&&n.midDistanceFade>si}}resolveLevel(n,t,i){const a=this.config.hysteresisDistance;if(t===vt.Near)return n>this.config.nearMaxDistance+a?vt.Mid:vt.Near;if(t===vt.Mid){if(n<this.config.nearMaxDistance-a)return vt.Near;const o=i?this.config.midMaxDistance:this.config.farMaxDistance;return n>o+a?i?vt.Far:vt.Terrain:vt.Mid}return t===vt.Far&&i?n<this.config.midMaxDistance-a?vt.Mid:n>this.config.farMaxDistance+a?vt.Terrain:vt.Far:n>=this.config.farMaxDistance-a?vt.Terrain:i?vt.Far:vt.Mid}resolveNearCoverage(n){const t=this.config.nearMaxDistance-this.config.transitionDistance,i=this.config.nearMaxDistance+this.config.transitionDistance;return 1-Dt.smoothstep(n,t,i)}resolveFarEntry(n){const t=this.config.midMaxDistance-this.config.transitionDistance,i=this.config.midMaxDistance+this.config.transitionDistance;return Dt.smoothstep(n,t,i)}resolveFarCoverage(n,t,i){const a=this.config.farMaxDistance-this.config.transitionDistance,o=this.config.farMaxDistance+this.config.transitionDistance,s=Dt.smoothstep(n,a,o),d=(1-t)*Pd;return Dt.lerp(d,1,i)*(1-s)}resolveLegacyMidDistanceFade(n){const t=this.config.farMaxDistance-this.config.transitionDistance,i=this.config.farMaxDistance+this.config.transitionDistance;return 1-Dt.smoothstep(n,t,i)}}function li(e,n,t){const i=e[n];e[n]=e[t],e[t]=i}function er(e,n,t,i,a){a.set(e.subarray(n,n+i)),e.copyWithin(n,t,t+i),e.set(a.subarray(0,i),t)}const Bn=new Ie(...As).normalize(),Id=-Bn.x/Math.max(Bn.y,.2),Nd=-Bn.z/Math.max(Bn.y,.2),tr=.001;class yd{constructor(){Le(this,"disc",new pt(0,0,0,1));Le(this,"strengthValue",0)}set(n,t,i,a,o,s){if(!Number.isFinite(n)||!Number.isFinite(t)||!Number.isFinite(i)||!Number.isFinite(a)||!Number.isFinite(o)||!Number.isFinite(s)||a<=0||s<=tr){this.clear();return}const d=Math.max(0,o);this.disc.set(n+Id*d,t,i+Nd*d,a),this.strengthValue=Math.min(1,s)}clear(){this.strengthValue=0}get strength(){return this.strengthValue}isEnabled(){return this.strengthValue>tr}}const ci=new yd,Sn=4,nr={resolution:256,coverage:24,recoveryRate:.5,freshnessRate:1.4},ir=.04,Fd=.3,Gd=1/30,Od=1e-6,ar=.1,fi=8,Bd=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,Hd=`
precision highp float;

#define MAX_CONTACTS ${Sn}

uniform sampler2D uPrevious;
uniform vec2 uCenter;
uniform vec2 uPreviousCenter;
uniform float uCoverage;
uniform float uInitialize;
uniform float uDelta;
uniform float uRecoveryRate;
uniform float uRecoveryFloor;
uniform float uFreshnessRate;
uniform int uContactCount;
// xy world position, z radius, w strength
uniform vec4 uContacts[MAX_CONTACTS];
// xy travel direction, z inner radius fraction, w directional blend
uniform vec4 uContactShapes[MAX_CONTACTS];

varying vec2 vUv;

void main() {
  vec2 world = uCenter + (vUv - 0.5) * uCoverage;

  // Reproject through the scroll delta. Texels that just entered the covered
  // square have no history and read neutral.
  vec2 previousUv = (world - uPreviousCenter) / uCoverage + 0.5;
  vec4 previous = vec4(0.5, 0.5, 0.0, 0.0);
  if (
    uInitialize < 0.5 &&
    previousUv.x >= 0.0 && previousUv.x <= 1.0 &&
    previousUv.y >= 0.0 && previousUv.y <= 1.0
  ) {
    previous = texture2D(uPrevious, previousUv);
  }

  vec2 direction = previous.rg * 2.0 - 1.0;
  // Exponential decay alone leaves faint crush hanging around forever, and on
  // the 8-bit fallback target it freezes outright: below roughly 0.24 the
  // per-frame decrement rounds to zero and the texel never recovers. The linear
  // floor term guarantees the field returns to neutral in bounded time.
  float crush = max(
    0.0,
    previous.b * exp(-uRecoveryRate * uDelta) - uRecoveryFloor * uDelta
  );
  float freshness = max(0.0, previous.a - uFreshnessRate * uDelta);

  float appliedCrush = 0.0;
  vec2 appliedDirection = vec2(0.0);
  for (int index = 0; index < MAX_CONTACTS; index += 1) {
    if (index >= uContactCount) {
      break;
    }
    vec4 contact = uContacts[index];
    vec4 shape = uContactShapes[index];
    vec2 offset = world - contact.xy;
    // Contacts occupy well under one percent of the trail square. Reject the
    // other texels before paying for sqrt and the smoothstep falloffs.
    float distanceSquared = dot(offset, offset);
    float radiusSquared = contact.z * contact.z;
    if (distanceSquared >= radiusSquared) {
      continue;
    }
    float distanceToContact = sqrt(distanceSquared);
    // A disc for footfalls (inner = 0); a ring for the expanding landing pulse.
    float inner = contact.z * shape.z;
    float ringMask = inner > 0.0
      ? smoothstep(inner * 0.4, inner, distanceToContact)
      : 1.0;
    float falloff =
      ringMask *
      (1.0 - smoothstep(max(inner, contact.z * 0.25), contact.z, distanceToContact));
    float amount = falloff * contact.w;
    if (amount <= 0.0) {
      continue;
    }
    vec2 away = distanceToContact > 1e-4
      ? offset / distanceToContact
      : shape.xy;
    vec2 push = mix(away, shape.xy, shape.w);
    float pushLength = length(push);
    push = pushLength > 1e-4 ? push / pushLength : away;
    appliedDirection += push * amount;
    appliedCrush = max(appliedCrush, amount);
  }

  if (appliedCrush > 0.0) {
    float appliedLength = length(appliedDirection);
    vec2 newDirection = appliedLength > 1e-4
      ? appliedDirection / appliedLength
      : direction;
    // A stronger contact overrides the stored lay of the grass; a weaker one
    // only nudges it, so a light brush does not undo a deep footprint.
    float authority = appliedCrush / max(crush, appliedCrush);
    direction = mix(direction, newDirection, clamp(authority, 0.0, 1.0));
    float directionLength = length(direction);
    direction = directionLength > 1e-4 ? direction / directionLength : newDirection;
    crush = max(crush, appliedCrush);
    freshness = max(freshness, appliedCrush);
  }

  gl_FragColor = vec4(direction * 0.5 + 0.5, clamp(crush, 0.0, 1.0), clamp(freshness, 0.0, 1.0));
}
`;class Vd{constructor(){Le(this,"config",{...nr});Le(this,"inverseCoverage",1/nr.coverage);Le(this,"renderer");Le(this,"targets");Le(this,"readTarget",0);Le(this,"recoveryFloorRatio",ir);Le(this,"scene",new vs);Le(this,"camera",new Mi(-1,1,1,-1,0,1));Le(this,"center",new it);Le(this,"previousCenter",new it);Le(this,"focus",new it);Le(this,"contacts",new Float32Array(Sn*fi));Le(this,"contactCount",0);Le(this,"accumulatedDeltaSeconds",0);Le(this,"material");Le(this,"quad");Le(this,"hasFocus",!1);Le(this,"enabled",!1)}configure(n){const t={...this.config,...n};if(Wd(t),this.config=t,this.inverseCoverage=1/this.config.coverage,this.renderer){const i=this.renderer;this.releaseTargets(),this.attach(i)}}attach(n){if(this.targets){if(this.renderer===n)return;this.releaseTargets()}this.renderer=n;const t=[];try{const i=this.targetSize(),a=kd(n);this.recoveryFloorRatio=a===Bt?ir:Fd;const o=rr(i,a);t.push(o);const s=rr(i,a);t.push(s),this.targets=[o,s],t.length=0,this.material=new Vt({vertexShader:Bd,fragmentShader:Hd,depthTest:!1,depthWrite:!1,uniforms:{uPrevious:{value:this.targets[0].texture},uCenter:{value:new it},uPreviousCenter:{value:new it},uCoverage:{value:this.config.coverage},uInitialize:{value:0},uDelta:{value:0},uRecoveryRate:{value:this.config.recoveryRate},uRecoveryFloor:{value:this.config.recoveryRate*this.recoveryFloorRatio},uFreshnessRate:{value:this.config.freshnessRate},uContactCount:{value:0},uContacts:{value:Array.from({length:Sn},()=>new pt)},uContactShapes:{value:Array.from({length:Sn},()=>new pt(0,1,0,0))}}}),this.quad=new Ht(new bi(2,2),this.material),this.quad.frustumCulled=!1,this.scene.add(this.quad),this.enabled=!0,this.primeTargets()}catch(i){for(const a of t)a.dispose();throw this.releaseTargets(),this.renderer=void 0,i}}setFocus(n,t){!Number.isFinite(n)||!Number.isFinite(t)||(this.focus.set(n,t),this.hasFocus=!0)}submitContact(n,t,i,a,o,s,d,M){if(!zd(n,t,i,a,o,s,d,M)||a<=0||i<=0||this.contactCount>=Sn)return;const g=this.contactCount*fi;this.contacts[g]=n,this.contacts[g+1]=t,this.contacts[g+2]=i,this.contacts[g+3]=a,this.contacts[g+4]=o,this.contacts[g+5]=s,this.contacts[g+6]=d,this.contacts[g+7]=M,this.contactCount+=1}render(n){const t=this.renderer,i=this.targets,a=this.material;if(!t||!i||!a||!this.enabled||!this.hasFocus){this.resetPendingFrame();return}if(!Number.isFinite(n)||n<=0){this.resetPendingFrame();return}if(this.accumulatedDeltaSeconds=Math.min(ar,this.accumulatedDeltaSeconds+Math.min(n,ar)),this.accumulatedDeltaSeconds+Od<Gd){this.contactCount=0;return}const o=this.accumulatedDeltaSeconds;this.accumulatedDeltaSeconds=0,this.previousCenter.copy(this.center);const s=this.config.coverage/this.targetSize();this.center.set(Math.round(this.focus.x/s)*s,Math.round(this.focus.y/s)*s);const d=a.uniforms;d.uPrevious.value=i[this.readTarget].texture,d.uCenter.value.copy(this.center),d.uPreviousCenter.value.copy(this.previousCenter),d.uCoverage.value=this.config.coverage,d.uDelta.value=o,d.uRecoveryRate.value=this.config.recoveryRate,d.uRecoveryFloor.value=this.config.recoveryRate*this.recoveryFloorRatio,d.uFreshnessRate.value=this.config.freshnessRate,d.uContactCount.value=this.contactCount;const M=d.uContacts.value,g=d.uContactShapes.value;for(let h=0;h<this.contactCount;h+=1){const S=h*fi;M[h].set(this.contacts[S],this.contacts[S+1],this.contacts[S+2],this.contacts[S+3]),g[h].set(this.contacts[S+4],this.contacts[S+5],Dt.clamp(this.contacts[S+6],0,.95),Dt.clamp(this.contacts[S+7],0,1))}this.contactCount=0;const F=1-this.readTarget,C=t.getRenderTarget();try{t.setRenderTarget(i[F]),t.render(this.scene,this.camera),this.readTarget=F}finally{t.setRenderTarget(C)}}isEnabled(){return this.enabled&&this.hasFocus&&this.targets!==void 0}getTexture(){var n;return((n=this.targets)==null?void 0:n[this.readTarget].texture)??null}getCenter(){return this.center}getInverseCoverage(){return this.inverseCoverage}dispose(){this.releaseTargets(),this.renderer=void 0,this.enabled=!1,this.hasFocus=!1,this.resetPendingFrame()}targetSize(){return Math.max(32,Math.round(this.config.resolution))}resetPendingFrame(){this.contactCount=0,this.accumulatedDeltaSeconds=0}releaseTargets(){var n;this.quad&&(this.scene.remove(this.quad),this.quad.geometry.dispose(),this.quad=void 0),(n=this.material)==null||n.dispose(),this.material=void 0;for(const t of this.targets??[])t.dispose();this.targets=void 0,this.readTarget=0,this.enabled=!1}primeTargets(){const n=this.renderer,t=this.targets,i=this.material;if(!n||!t||!i)return;i.uniforms.uInitialize.value=1,i.uniforms.uContactCount.value=0,i.uniforms.uDelta.value=0;const a=n.getRenderTarget();try{for(const o of t)n.setRenderTarget(o),n.render(this.scene,this.camera)}finally{n.setRenderTarget(a),i.uniforms.uInitialize.value=0}}}function Wd(e){if(!Number.isInteger(e.resolution)||e.resolution<32)throw new Error("Grass trail resolution must be an integer of at least 32.");for(const[n,t]of[["coverage",e.coverage],["recoveryRate",e.recoveryRate],["freshnessRate",e.freshnessRate]])if(!Number.isFinite(t)||t<=0)throw new Error(`Grass trail ${n} must be a positive finite number.`)}function zd(...e){return e.every(Number.isFinite)}function kd(e){const n=e.extensions;return n.has("EXT_color_buffer_half_float")||n.has("EXT_color_buffer_float")?Bt:Rt}function rr(e,n){const t=new Pt(e,e,{format:Gt,type:n,minFilter:_t,magFilter:_t,wrapS:Tn,wrapT:Tn,depthBuffer:!1,stencilBuffer:!1,generateMipmaps:!1});return t.texture.colorSpace=Yt,t}const wn=new Vd,Xd=1/48,qd=.06,Yd=.085,Kd=.55,$d=.037,Zd=.31,jd=1.7,Qd=.72,Jd=.28;function ep(e){const{target:n,position:t,windDirection:i,time:a,scale:o,speed:s}=e;return`
float ${n} = 0.5 + 0.5 * (
  sin(
    dot(${t}, ${i}) * ${o} -
    ${a} * ${s}
  ) * ${Qd.toFixed(2)} +
  sin(
    dot(
      ${t},
      vec2(-${i}.y, ${i}.x)
    ) * ${$d.toFixed(3)} +
    ${a} * ${Zd.toFixed(2)} +
    ${jd.toFixed(2)}
  ) * ${Jd.toFixed(2)}
);
`}const Ct=128,ui=4,di=11;function Un(e,n,t){let i=Math.imul(e,374761393)^Math.imul(n,668265263)^t;return i=Math.imul(i^i>>>13,1274126177),((i^i>>>16)>>>0)/4294967296}function or(e,n,t,i){const a=Math.floor(e),o=Math.floor(n),s=e-a,d=n-o,M=s*s*(3-2*s),g=d*d*(3-2*d),F=(a%t+t)%t,C=(o%t+t)%t,h=(F+1)%t,S=(C+1)%t,R=Un(F,C,i),B=Un(h,C,i),u=Un(F,S,i),c=Un(h,S,i),w=R+(B-R)*M,I=u+(c-u)*M;return w+(I-w)*g}function sr(e){return Math.max(0,Math.min(255,Math.round(e*255)))}function tp(e=1597334677){const n=new Uint8Array(Ct*Ct*2);for(let i=0;i<Ct;i+=1)for(let a=0;a<Ct;a+=1){const o=a/Ct*ui,s=i/Ct*ui,d=or(o,s,ui,e),M=or(a/Ct*di,i/Ct*di,di,e^2654435769),g=(d+M*.5)/1.5,F=g*g*(3-2*g),C=(i*Ct+a)*2;n[C]=sr(F),n[C+1]=sr(M)}const t=new dr(n,Ct,Ct,an,Rt);return t.name="grass-wind-noise",t.wrapS=mi,t.wrapT=mi,t.minFilter=_t,t.magFilter=_t,t.generateMipmaps=!1,t.colorSpace=Yt,t.needsUpdate=!0,t}let en;function vh(){return en||(en=tp()),en}function Sh(){en==null||en.dispose(),en=void 0}const np=.28,ip=1,ap=1.7,rp=1.02,op=.18,sp=.2,lp=.035,cp=.48,fp=.18,up=.58,dp=.55,pp=.9,hp=1.08,mp=.55,Mt={tipStart:np,tipEnd:ip,tipLuminanceScale:ap,dryLuminanceScale:rp,shadeDrynessPivot:op,shadeDrynessScale:sp,shadeDrynessMaximum:lp,instanceDrynessBase:cp,instanceDrynessTip:fp,drynessMaximum:up,rootFadeEnd:dp,shadeLightMinimum:pp,shadeLightMaximum:hp,shadowDesaturation:mp},fn=new Ie(.2126,.7152,.0722);function St(e){if(!Number.isFinite(e))throw new TypeError("Grass palette GLSL values must be finite.");return Number.isInteger(e)?`${e}.0`:String(e)}function pi(e){return e.r*fn.x+e.g*fn.y+e.b*fn.z}function lr(e,n,t,i,a,o){e.set(i),n.set(a),t.set(o);const s=Math.max(pi(e),1e-4);n.multiplyScalar(s*Mt.tipLuminanceScale/Math.max(pi(n),1e-4)),t.multiplyScalar(s*Mt.dryLuminanceScale/Math.max(pi(t),1e-4))}const _p=.62,gp=St(_p),Hr=`
vec3 grassResolvePalette(
  vec3 baseColor,
  vec3 tipColor,
  vec3 dryColor,
  float progress,
  float shade,
  float dryness,
  float rootAo,
  float tipColorStrength,
  float rootDarkening
) {
  float tipProfile = smoothstep(
    ${St(Mt.tipStart)},
    ${St(Mt.tipEnd)},
    progress
  );
  vec3 healthyColor = mix(
    baseColor,
    tipColor,
    tipProfile * tipColorStrength
  );
  float shadeDryness = clamp(
    (${St(Mt.shadeDrynessPivot)} - shade) *
      ${St(Mt.shadeDrynessScale)},
    0.0,
    ${St(Mt.shadeDrynessMaximum)}
  );
  float instanceDryness = dryness * (
    ${St(Mt.instanceDrynessBase)} +
    tipProfile * ${St(Mt.instanceDrynessTip)}
  );
  vec3 paletteColor = mix(
    healthyColor,
    dryColor,
    clamp(
      shadeDryness + instanceDryness,
      0.0,
      ${St(Mt.drynessMaximum)}
    )
  );
  float rootLight = mix(
    rootDarkening,
    1.0,
    smoothstep(0.0, ${St(Mt.rootFadeEnd)}, progress)
  );
  float bladeVariation = mix(
    ${St(Mt.shadeLightMinimum)},
    ${St(Mt.shadeLightMaximum)},
    shade
  );
  float occlusion = rootLight * bladeVariation * rootAo;
  vec3 shadedColor = paletteColor * occlusion;
  // Every term above is a scalar, so a blade gets darker without its green ever
  // getting less pure — and a dark, fully saturated green is not a colour ACES
  // can carry. Its output matrix takes red negative and the clamp eats it: in a
  // settled capture 7.5% of near-field vegetation pixels had red at exactly
  // zero, against 0.0% in the far field. That clipping is most of what reads as
  // a neon carpet rather than a meadow, and no amount of palette retuning fixes
  // it while the darkening stays purely multiplicative.
  //
  // Shadowed vegetation is lit by the sky and by bounce off the ground, not by
  // nothing, so it loses saturation as it darkens. Letting it do that here puts
  // the albedo back inside the gamut as a side effect of being more correct.
  //
  // The blend runs toward the colour's own luminance, so it cannot shift the
  // field's brightness — which is what lets one shared function change every
  // LOD at once without moving the near/mid/far parity budget.
  return mix(
    shadedColor,
    vec3(dot(shadedColor, vec3(
      ${St(fn.x)},
      ${St(fn.y)},
      ${St(fn.z)}
    ))),
    clamp(
      (1.0 - occlusion) * ${St(Mt.shadowDesaturation)},
      0.0,
      1.0
    )
  );
}
`,vp=1.29,Sp=12,Ep=.16,xp=.55,cr=.09,Mp=42,Tp=18,fr=.55,Ap=.00107,bp=1.15,Rp=3,ur=.06,Cp=30,Vr=64,Eh=Object.freeze({start:24,end:Vr,floor:.35}),Wr=`
#define GRASS_MAX_BIOMES ${Vn}
uniform vec3 uGrassBiomeBase[GRASS_MAX_BIOMES];
uniform vec3 uGrassBiomeTip[GRASS_MAX_BIOMES];
uniform vec3 uGrassBiomeDry[GRASS_MAX_BIOMES];
// x: root darkening, y: tip colour strength.
uniform vec2 uGrassBiomeShade[GRASS_MAX_BIOMES];

// Indexing a uniform array out of range is undefined behaviour in GLSL ES 3.0,
// so the row is clamped rather than trusted. The data is always in range today;
// this is what keeps a future profile-count mismatch a wrong colour instead of
// a driver-dependent crash.
int grassResolveBiomeRow(float biome) {
  return int(clamp(biome, 0.0, float(GRASS_MAX_BIOMES - 1)) + 0.5);
}
`,Dp=`
attribute float grassProgress;
attribute float grassPhase;
attribute float grassBladeShade;
attribute vec4 instanceVariation;
attribute float instanceCoverage;
attribute float instanceBiome;
uniform float uGrassTime;
uniform vec2 uGrassWindDirection;
uniform float uGrassWindStrength;
uniform float uGrassGustScale;
uniform float uGrassGustSpeed;
uniform float uGrassFlutterStrength;
uniform float uGrassFlutterSpeed;
uniform float uGrassNormalUp;
uniform float uGrassWindLodScale;
uniform float uGrassDitherSeed;
uniform float uGrassNearDistance;
uniform float uGrassMidDistance;
uniform float uGrassTransitionDistance;
uniform float uGrassDetailMode;
uniform float uGrassDetailNearDistance;
uniform float uGrassDetailTransitionDistance;
uniform float uGrassLodInvert;
uniform float uGrassArtDensityScale;
uniform float uGrassBladeCurvature;
uniform float uGrassGustFrontScale;
uniform float uGrassGustFrontSpeed;
uniform float uGrassGustFrontDepth;
uniform float uGrassGustTipBoost;
uniform float uGrassSheenFadeDistance;
uniform float uGrassDensityFalloffStart;
uniform float uGrassDensityFalloffEnd;
uniform float uGrassDensityFloor;
uniform float uGrassLodDensityScale;
varying vec2 vGrassSheen;

vec3 grassRotateAroundAxis(
  vec3 value,
  vec3 axis,
  float sine,
  float cosine
) {
  return value * cosine + cross(axis, value) * sine +
    axis * dot(axis, value) * (1.0 - cosine);
}
`,Pp=`
uniform float uGrassPixelWorldScale;
uniform float uGrassMinPixelWidth;
uniform float uGrassBladeHalfWidth;
uniform float uGrassMaxWidenDistance;
`,Lp=`
uniform sampler2D uGrassTrailMap;
uniform vec2 uGrassTrailCenter;
uniform float uGrassTrailInverseCoverage;
uniform float uGrassTrailStrength;
uniform float uGrassTrailMaxAngle;
uniform float uGrassTrailWobbleFrequency;
uniform float uGrassTrailWobbleAmplitude;
uniform vec4 uGrassGroundShadowDisc;
uniform float uGrassGroundShadowStrength;
varying float vGrassGroundShade;
`,wp=`
bool grassKeepLod;
if (uGrassLodInvert < 0.5) {
  grassKeepLod = grassDither <= grassNearCoverage * grassDensityFalloff;
} else {
  grassDensityFalloff *= mix(
    1.0,
    uGrassDensityFloor,
    smoothstep(
      uGrassDensityFalloffStart,
      uGrassDensityFalloffEnd,
      grassCameraDistance
    )
  );
  float grassLodCut = max(grassNearCoverage, grassFarDistanceEntry);
  grassKeepLod = grassDither > 1.0 - grassDensityFalloff * (1.0 - grassLodCut);
}
`,Up=`
bool grassKeepLod = uGrassLodInvert < 0.5
  ? grassDither <= uGrassLodThreshold
  : grassDither > uGrassLodThreshold && grassDither <= uGrassDistanceFade;
`,Ip=`
uniform float uGrassLodThreshold;
uniform float uGrassDistanceFade;
`,Np=`
vec3 grassWidthAxis = cross(vec3(0.0, 1.0, 0.0), objectNormal);
float grassWidthAxisLength = length(grassWidthAxis);
grassWidthAxis = grassWidthAxisLength > 0.0001
  ? grassWidthAxis / grassWidthAxisLength
  : vec3(1.0, 0.0, 0.0);
float grassSide = uv.x * 2.0 - 1.0;
objectNormal = normalize(mix(objectNormal, vec3(0.0, 1.0, 0.0), uGrassNormalUp));
objectNormal = normalize(
  objectNormal + grassWidthAxis * (grassSide * uGrassBladeCurvature)
);
`,yp=`
varying float vGrassProgress;
varying float vGrassShade;
varying float vGrassDryness;
varying float vGrassRootAo;
flat varying float vGrassBiome;
varying float vGrassGust;
`,Fp=`
// The instance's translation is its fourth column; multiplying the full matrix
// by the origin is the same value for eight times the work, per vertex.
vec4 grassWorldRoot = modelMatrix * vec4(instanceMatrix[3].xyz, 1.0);
float grassDither = fract(
  grassBladeShade * 0.754877666 +
  grassPhase * 0.569840296 +
  GRASS_DITHER_INSTANCE_TERM
  uGrassDitherSeed
);
GRASS_GUST_NOISE
float grassFieldDither = fract(
  grassBladeShade * 0.438289 +
  grassPhase * 0.819173 +
  instanceVariation.x * 0.347193 +
  uGrassDitherSeed * 1.618034
);
// Motion phase is deliberately a *separate* quantity from the dithers above.
//
// The single-blade layers instance one source blade, so its grassPhase is the
// same 0.5 for every near instance: flutter timing and stiffness were therefore
// synchronised across the whole near field, which on compact — where the gust
// source is a single coherent sine — reads as rows of grass bending together.
// Folding in the per-instance variation decorrelates both.
//
// It must not be substituted into either dither: the mid layer's CPU draw
// truncation reproduces grassDither exactly and depends on it carrying no
// per-instance term, so LOD selection and motion have to stay independent.
float grassMotionPhase = fract(grassPhase + instanceVariation.x);
float grassCameraDistance = distance(cameraPosition, grassWorldRoot.xyz);
float grassMicroFade = 1.0 - smoothstep(
  uGrassNearDistance * 0.45,
  uGrassMidDistance,
  grassCameraDistance
);
float grassNearCoverage = 1.0 - smoothstep(
  uGrassNearDistance - uGrassTransitionDistance,
  uGrassNearDistance + uGrassTransitionDistance,
  grassCameraDistance
);
float grassFarDistanceEntry = smoothstep(
  uGrassMidDistance - uGrassTransitionDistance,
  uGrassMidDistance + uGrassTransitionDistance,
  grassCameraDistance
);
float grassDetailCoverage = 1.0 - smoothstep(
  uGrassDetailNearDistance - uGrassDetailTransitionDistance,
  uGrassDetailNearDistance + uGrassDetailTransitionDistance,
  grassCameraDistance
);
// Starts at the quality governor's global scale and, for the mid layer, picks
// up the distance falloff inside the keep test below. The sub-pixel width clamp
// reads the final value to widen the survivors by the area the thinning gave up.
float grassDensityFalloff = uGrassLodDensityScale;
GRASS_KEEP_LOD
bool grassKeepDetail = uGrassDetailMode < 0.5 ||
  (uGrassDetailMode < 1.5
    ? grassDither > grassDetailCoverage
    : grassDither <= grassDetailCoverage);
// instanceCoverage carries both the per-instance field coverage and the
// streaming fade-in. Both used to be separate uniforms, but three only uploads
// a shared material's uniforms once per contiguous run of draws, so per-mesh
// values never reached the GPU. Per-instance data has no such problem.
bool grassKeepBlade =
  grassKeepLod &&
  grassKeepDetail &&
  grassFieldDither <= min(instanceCoverage * uGrassArtDensityScale, 1.0);

if (!grassKeepBlade) {
  // Every vertex in a blade shares the keep decision, so a rejected blade
  // collapses to a zero-area triangle and is dropped at primitive assembly.
  // This is the only place blades are rejected: evaluating it here rather than
  // as a fragment discard is what lets the fragment shader stay early-Z
  // friendly, and it is also exact, since the decision no longer depends on
  // interpolating a constant varying across the triangle.
  transformed = vec3(0.0);
}

GRASS_SHEEN_VARYING

float grassCoverage = 1.0;
GRASS_GROUND_SHADE_INIT
GRASS_SUBPIXEL_WIDTH

if (grassKeepBlade && grassProgress > 0.001) {
  vec2 grassWindDirection = uGrassWindDirection;
  mat3 grassInstanceBasis = mat3(instanceMatrix);
  float grassHorizontalScale = max(length(grassInstanceBasis[0]), 0.0001);
  float grassVerticalScale = max(length(grassInstanceBasis[1]), 0.0001);
  float grassDepthScale = max(length(grassInstanceBasis[2]), 0.0001);
  // A gust front travelling along the wind, tens of metres between crests. The
  // local term below has a sub-metre wavelength and a per-instance phase, so on
  // its own it can only ever produce uncorrelated chatter — no amount of tuning
  // makes a wave out of it. The envelope only ever scales the bend down, which
  // is what lets the reserved bounds and the configured wind strength keep
  // their existing meaning: grassGustNoise is in [0, 1], so the envelope is in
  // [1 - depth, 1] whichever gust source was compiled in.
  float grassGustEnvelope =
    mix(1.0 - uGrassGustFrontDepth, 1.0, grassGustNoise);
  float grassGust = sin(
    dot(grassWorldRoot.xz, grassWindDirection) / uGrassGustScale +
    uGrassTime * uGrassGustSpeed +
    instanceVariation.x * 6.28318530718
  );
  float grassFlutter = sin(
    dot(grassWorldRoot.xz, vec2(-grassWindDirection.y, grassWindDirection.x)) /
      (uGrassGustScale * 0.37) +
    uGrassTime * uGrassFlutterSpeed +
    grassMotionPhase * 6.28318530718
  );
  float grassStiffness = mix(
    0.76,
    1.12,
    fract(grassMotionPhase * 1.61803398875)
  );
  float grassBend = (
    grassGust * uGrassWindStrength +
    grassFlutter * uGrassFlutterStrength * grassMicroFade
  ) * instanceVariation.y * grassStiffness * pow(grassProgress, 1.65) *
    uGrassWindLodScale * grassGustEnvelope;
  vec3 grassWorldWind = vec3(grassWindDirection.x, 0.0, grassWindDirection.y);
  // Rotate about the root instead of translating the vertex. Translation makes
  // a bent blade longer than a straight one; the trail bend below documents
  // that as the source of the rubbery look and was rewritten to rotate, but the
  // wind path kept the old form and stretched every blade it moved.
  vec2 grassWindLocal = vec2(
    dot(grassWorldWind, grassInstanceBasis[0] / grassHorizontalScale),
    dot(grassWorldWind, grassInstanceBasis[2] / grassDepthScale)
  );
  float grassWindSin = sin(grassBend);
  float grassWindCos = cos(grassBend);
  float grassWindHeight = transformed.y;
  transformed.x += grassWindLocal.x * grassWindHeight * grassWindSin *
    (grassVerticalScale / grassHorizontalScale);
  transformed.z += grassWindLocal.y * grassWindHeight * grassWindSin *
    (grassVerticalScale / grassDepthScale);
  transformed.y *= grassWindCos;
  vec3 grassWindAxis = vec3(grassWindLocal.y, 0.0, -grassWindLocal.x);
  float grassWindAxisLength = length(grassWindAxis);
  if (grassWindAxisLength > 0.0001) {
    vec3 grassWindAxisView = normalize(
      mat3(modelViewMatrix) * grassInstanceBasis *
        (grassWindAxis / grassWindAxisLength)
    );
    vNormal = normalize(grassRotateAroundAxis(
      vNormal,
      grassWindAxisView,
      grassWindSin,
      grassWindCos
    ));
  }
GRASS_TRAIL_BEND
}

if (grassKeepBlade) {
vNormal = normalize(mix(
  vNormal,
  normalize(mat3(modelViewMatrix) * vec3(0.0, 1.0, 0.0)),
  (1.0 - grassMicroFade) * 0.58
));
}

`,Gp=`
vGrassSheen = vec2(
  (1.0 - smoothstep(
    uGrassSheenFadeDistance * 0.55,
    uGrassSheenFadeDistance,
    grassCameraDistance
  )) * (0.45 + 0.85 * grassGustNoise),
  mix(0.55, 1.0, grassProgress)
);
`,Op=`
vGrassSheen = vec2(0.0, mix(0.55, 1.0, grassProgress));
`,Bp=`
vec2 grassGustUv = grassWorldRoot.xz * uGrassWindNoiseScale -
  uGrassWindDirection * (uGrassTime * uGrassWindNoiseSpeed);
float grassGustNoise = texture2D(uGrassWindNoise, grassGustUv).r;
`,Hp=ep({target:"grassGustNoise",position:"grassWorldRoot.xz",windDirection:"uGrassWindDirection",time:"uGrassTime",scale:"uGrassGustFrontScale",speed:"uGrassGustFrontSpeed"}),Vp=`
uniform sampler2D uGrassWindNoise;
uniform float uGrassWindNoiseScale;
uniform float uGrassWindNoiseSpeed;
`,Wp=`
if (grassKeepBlade) {
  float grassWidthScale = max(length(vec3(instanceMatrix[0])), 0.0001);
  float grassSourceHalfWidth = uGrassBladeHalfWidth * grassWidthScale;
  // inversesqrt(falloff) is the width a survivor needs to cover the ground its
  // dropped neighbours used to. Thinning without it would read as the field
  // going bald with distance; thinning with it is invisible, and the colour
  // payback below keeps average brightness flat across the LOD handoff.
  float grassTargetHalfWidth = min(
    grassCameraDistance * uGrassPixelWorldScale * uGrassMinPixelWidth * 0.5 *
      inversesqrt(max(grassDensityFalloff, 0.04)),
    uGrassMaxWidenDistance
  );
  float grassWidenedHalfWidth = max(grassSourceHalfWidth, grassTargetHalfWidth);
  grassCoverage = grassSourceHalfWidth / grassWidenedHalfWidth;
  // grassSide is 0 at the single-triangle blade's apex, so the blade widens at
  // the base and keeps its point.
  transformed += grassWidthAxis *
    (grassSide * (grassWidenedHalfWidth - grassSourceHalfWidth) / grassWidthScale);
}
`,zp=`
  // Contact occlusion under the character. Grass takes no part in the shadow
  // map (see GrassGroundShadow), so without this the field stays fully lit right
  // up to the feet standing in it and the character reads as a decal.
  //
  // Two falloffs, because a body near the ground occludes two different things.
  // Across the ground it is a soft disc, squared so the darkest part stays
  // small and the edge stays wide. Up the blade it is strongest at the root and
  // gone by the tip: the sky the root cannot see is most of what lights it,
  // while a tip standing clear of the disc is lit normally. Fading it out that
  // way also hides the disc's edge, which is the tell on a fake like this.
  if (uGrassGroundShadowStrength > 0.0) {
    vec2 grassGroundOffset = grassWorldRoot.xz - uGrassGroundShadowDisc.xz;
    float grassGroundRadius = max(uGrassGroundShadowDisc.w, 0.0001);
    float grassGroundFalloff = 1.0 - saturate(
      length(grassGroundOffset) / grassGroundRadius
    );
    if (grassGroundFalloff > 0.0) {
      // The root's own height above the contact point, so grass on a bank above
      // the character does not darken as if it were underfoot.
      float grassGroundLift = 1.0 - saturate(
        abs(grassWorldRoot.y - uGrassGroundShadowDisc.y) * 0.6
      );
      vGrassGroundShade = 1.0 -
        grassGroundFalloff * grassGroundFalloff * grassGroundLift *
        uGrassGroundShadowStrength * (1.0 - grassProgress * 0.72);
    }
  }
  if (uGrassTrailStrength > 0.0) {
    // The AABB reject is the whole early-out: two compares before any fetch,
    // and the trail square only ever covers a couple of dozen metres around the
    // character while this layer draws every blade in the near band.
    vec2 grassTrailUv =
      (grassWorldRoot.xz - uGrassTrailCenter) * uGrassTrailInverseCoverage + 0.5;
    vec2 grassTrailInside = step(vec2(0.0), grassTrailUv) * step(grassTrailUv, vec2(1.0));
    if (grassTrailInside.x * grassTrailInside.y > 0.0) {
      vec4 grassTrailSample = texture2D(uGrassTrailMap, grassTrailUv);
      float grassTrailCrush = grassTrailSample.b;
      vec2 grassTrailDirection = grassTrailSample.rg * 2.0 - 1.0;
      float grassTrailDirectionLength = length(grassTrailDirection);
      if (grassTrailCrush > 0.004 && grassTrailDirectionLength > 0.02) {
        grassTrailDirection /= grassTrailDirectionLength;
        // Blades differ in how hard they resist, so a footprint is not a
        // uniformly flattened disc. This mixes in instanceVariation as well as
        // grassPhase: the single-blade layers instance one source blade, so a
        // phase-only seed would be identical for every blade in the field.
        float grassTrailSeed = fract(instanceVariation.x * 3.719 + grassPhase * 2.61803398875);
        float grassTrailStiffness = mix(1.22, 0.78, grassTrailSeed);
        // Saturating: blades directly under a foot flatten hard without the
        // response running away and pushing them through the ground.
        float grassTrailResponse = 1.0 - exp(-3.4 * grassTrailCrush * grassTrailStiffness);
        // Alpha is contact recency, re-seeded for as long as a contact covers
        // the texel, so this rings hardest while a foot is working the grass
        // and dies away over the second or so after it lifts.
        float grassTrailWobble = 1.0 + uGrassTrailWobbleAmplitude * grassTrailSample.a *
          sin(uGrassTime * uGrassTrailWobbleFrequency + grassTrailSeed * 6.28318530718);
        float grassHabitatBend = mix(
          0.78,
          1.16,
          saturate((grassVerticalScale - 0.7) * 1.8)
        ) * (1.0 - instanceVariation.w * 0.32);
        float grassTrailAngle = clamp(
          uGrassTrailMaxAngle * uGrassTrailStrength * grassTrailResponse *
            grassTrailWobble * grassHabitatBend,
          0.0,
          1.48
        );
        // The angle grows towards the tip, so the blade curves instead of
        // tilting rigidly out of the ground.
        float grassTrailTheta = grassTrailAngle * pow(grassProgress, 0.85);
        float grassTrailSin = sin(grassTrailTheta);
        float grassTrailCos = cos(grassTrailTheta);
        vec3 grassTrailWorld = vec3(grassTrailDirection.x, 0.0, grassTrailDirection.y);
        vec2 grassTrailLocal = vec2(
          dot(grassTrailWorld, grassInstanceBasis[0] / grassHorizontalScale),
          dot(grassTrailWorld, grassInstanceBasis[2] / grassDepthScale)
        );
        // World height of this vertex is localY * verticalScale; a rotation by
        // theta moves it localY * verticalScale * sin(theta) horizontally and
        // leaves localY * cos(theta) of local height. Converting the horizontal
        // part back through the instance's own scales keeps non-uniformly
        // scaled blades correct.
        float grassTrailHeight = transformed.y;
        transformed.x += grassTrailLocal.x * grassTrailHeight * grassTrailSin *
          (grassVerticalScale / grassHorizontalScale);
        transformed.z += grassTrailLocal.y * grassTrailHeight * grassTrailSin *
          (grassVerticalScale / grassDepthScale);
        transformed.y *= grassTrailCos;
        vec3 grassTrailAxis = vec3(
          grassTrailLocal.y,
          0.0,
          -grassTrailLocal.x
        );
        float grassTrailAxisLength = length(grassTrailAxis);
        if (grassTrailAxisLength > 0.0001) {
          vec3 grassTrailAxisView = normalize(
            mat3(modelViewMatrix) * grassInstanceBasis *
              (grassTrailAxis / grassTrailAxisLength)
          );
          vNormal = normalize(grassRotateAroundAxis(
            vNormal,
            grassTrailAxisView,
            grassTrailSin,
            grassTrailCos
          ));
        }
      }
    }
  }
`,kp=`
vGrassProgress = grassProgress;
vGrassShade = mix(grassBladeShade, 0.5, (1.0 - grassMicroFade) * 0.7);
vGrassDryness = instanceVariation.w;
vGrassRootAo = instanceVariation.z;
vGrassBiome = instanceBiome;
vGrassGust = grassGustNoise;
`,Xp=`
int grassBiomeRow = grassResolveBiomeRow(instanceBiome);
vec3 grassPaletteColor = grassResolvePalette(
  uGrassBiomeBase[grassBiomeRow],
  uGrassBiomeTip[grassBiomeRow],
  uGrassBiomeDry[grassBiomeRow],
  grassProgress,
  mix(grassBladeShade, 0.5, (1.0 - grassMicroFade) * 0.7),
  instanceVariation.w,
  instanceVariation.z,
  uGrassBiomeShade[grassBiomeRow].y,
  uGrassBiomeShade[grassBiomeRow].x
);
grassPaletteColor = mix(
  grassPaletteColor,
  uGrassBiomeTip[grassBiomeRow],
  grassGustNoise * uGrassGustTipBoost * grassProgress
);
vGrassColor = mix(grassPaletteColor, uGrassCanopyColor, 1.0 - grassCoverage);
vGrassProgress = grassProgress;
`,qp=`
${Wr}
uniform vec3 uGrassCanopyColor;
varying vec3 vGrassColor;
varying float vGrassProgress;
${Hr}
`,Yp=`
${Wr}
uniform vec3 uGrassTipColor;
uniform float uGrassGustTipBoost;
uniform float uGrassAmbientBoost;
uniform float uGrassBacklightStrength;
uniform float uGrassSheenStrength;
uniform float uGrassSheenPower;
varying float vGrassProgress;
varying float vGrassShade;
varying float vGrassDryness;
varying float vGrassRootAo;
flat varying float vGrassBiome;
varying float vGrassGust;
varying vec2 vGrassSheen;
${Hr}
`,Kp=`
varying float vGrassGroundShade;
`,$p=`
diffuseColor.rgb *= vGrassGroundShade;
`,Zp=`
uniform vec3 uGrassTipColor;
uniform float uGrassAmbientBoost;
uniform float uGrassBacklightStrength;
uniform float uGrassSheenStrength;
uniform float uGrassSheenPower;
varying vec3 vGrassColor;
varying vec2 vGrassSheen;
varying float vGrassProgress;
`,jp=`
#include <color_fragment>
diffuseColor.rgb = vGrassColor;
GRASS_GROUND_SHADE_APPLY
reflectedLight.indirectDiffuse += diffuseColor.rgb * uGrassAmbientBoost;
`,Qp=`
#include <color_fragment>
int grassBiomeRow = grassResolveBiomeRow(vGrassBiome);
diffuseColor.rgb = grassResolvePalette(
  uGrassBiomeBase[grassBiomeRow],
  uGrassBiomeTip[grassBiomeRow],
  uGrassBiomeDry[grassBiomeRow],
  vGrassProgress,
  vGrassShade,
  vGrassDryness,
  vGrassRootAo,
  uGrassBiomeShade[grassBiomeRow].y,
  uGrassBiomeShade[grassBiomeRow].x
);
diffuseColor.rgb = mix(
  diffuseColor.rgb,
  uGrassBiomeTip[grassBiomeRow],
  vGrassGust * uGrassGustTipBoost * vGrassProgress
);
GRASS_GROUND_SHADE_APPLY
reflectedLight.indirectDiffuse += diffuseColor.rgb * uGrassAmbientBoost;
`,Jp=`
float grassBackLight = 0.0;
vec3 grassSheen = vec3(0.0);
#if NUM_DIR_LIGHTS > 0
  vec3 grassViewDirection = normalize(vViewPosition);
  vec3 grassSunDirection = directionalLights[0].direction;
  // Transmission, not a rim. Light has to reach the camera through the blade,
  // so the sun must be behind it, the blade must be turned edge-on to the sun,
  // and a thin tip passes more of it than the thick base. The term this
  // replaces had only the first of those three and so lit every blade facing
  // the camera equally, which reads as a plastic outline rather than a leaf.
  float grassIntoSun = saturate(dot(-grassViewDirection, grassSunDirection));
  float grassThinness = 1.0 - abs(dot(normal, grassSunDirection));
  float grassRootAttenuation = smoothstep(0.12, 0.72, vGrassProgress);
  float grassViewFacing = saturate(dot(normal, grassViewDirection));
  grassBackLight = min(
    grassIntoSun * grassIntoSun * grassThinness * grassRootAttenuation *
      (0.35 + 0.65 * grassViewFacing) * vGrassSheen.y,
    0.82
  );
GRASS_SHEEN_OUTPUT
#endif
vec3 grassLambertLight =
  reflectedLight.directDiffuse +
  reflectedLight.indirectDiffuse +
  totalEmissiveRadiance;
vec3 outgoingLight =
  mix(diffuseColor.rgb, grassLambertLight, ${gp}) +
  mix(diffuseColor.rgb, uGrassTipColor, 0.35) *
    grassBackLight * uGrassBacklightStrength +
  grassSheen;
`,eh=`
  // Skip both the half-vector normalization and the high-power lobe once the
  // contribution has faded. This branch is coherent across distant quads.
  if (vGrassSheen.x > 0.001) {
    vec3 grassSunPlusView = grassSunDirection + grassViewDirection;
    vec3 grassHalfVector = length(grassSunPlusView) > 1e-4
      ? normalize(grassSunPlusView)
      : normal;
    grassSheen = directionalLights[0].color * (
      pow(saturate(dot(normal, grassHalfVector)), uGrassSheenPower) *
      uGrassSheenStrength * vGrassSheen.x
    );
  }
`;function hi(e){return Array.from({length:Vn},()=>new Ye(e))}function th(e,n){return Array.from({length:Vn},()=>new it(e,n))}class xh{constructor(n){Le(this,"material");Le(this,"colorControls",{baseColor:"#273f22",tipColor:"#83a96b",dryColor:"#a8a06a"});Le(this,"uniforms",{uGrassTime:{value:0},uGrassWindDirection:{value:new it(.8,.35).normalize()},uGrassWindStrength:{value:.14},uGrassGustScale:{value:.08},uGrassGustSpeed:{value:.65},uGrassFlutterStrength:{value:.035},uGrassFlutterSpeed:{value:3.4},uGrassBiomeBase:{value:hi(this.colorControls.baseColor)},uGrassBiomeTip:{value:hi(this.colorControls.tipColor)},uGrassBiomeDry:{value:hi(this.colorControls.dryColor)},uGrassBiomeShade:{value:th(.55,.5)},uGrassTipColor:{value:new Ye(this.colorControls.tipColor)},uGrassNormalUp:{value:.45},uGrassAmbientBoost:{value:.12},uGrassBacklightStrength:{value:.16},uGrassLodInvert:{value:0},uGrassLodThreshold:{value:1},uGrassDistanceFade:{value:1},uGrassDitherSeed:{value:0},uGrassWindLodScale:{value:1},uGrassNearDistance:{value:0},uGrassMidDistance:{value:0},uGrassTransitionDistance:{value:1},uGrassDetailMode:{value:0},uGrassDetailNearDistance:{value:0},uGrassDetailTransitionDistance:{value:1},uGrassArtDensityScale:{value:1},uGrassCanopyColor:{value:new Ye("#4d923f")},uGrassBladeCurvature:{value:xp},uGrassSheenStrength:{value:cr},uGrassSheenPower:{value:Mp},uGrassSheenFadeDistance:{value:Tp},uGrassGustFrontScale:{value:Yd},uGrassGustFrontSpeed:{value:Kd},uGrassGustFrontDepth:{value:fr},uGrassGustTipBoost:{value:Qa},uGrassWindNoise:{value:null},uGrassWindNoiseScale:{value:Xd},uGrassWindNoiseSpeed:{value:qd},uGrassDensityFalloffStart:{value:Cp},uGrassDensityFalloffEnd:{value:Vr},uGrassDensityFloor:{value:1},uGrassLodDensityScale:{value:1},uGrassPixelWorldScale:{value:Ap},uGrassMinPixelWidth:{value:bp},uGrassBladeHalfWidth:{value:.017},uGrassMaxWidenDistance:{value:ur},uGrassTrailMap:{value:null},uGrassTrailCenter:{value:new it},uGrassTrailInverseCoverage:{value:1},uGrassTrailStrength:{value:0},uGrassTrailMaxAngle:{value:vp},uGrassTrailWobbleFrequency:{value:Sp},uGrassTrailWobbleAmplitude:{value:Ep},uGrassGroundShadowDisc:{value:new pt(0,0,0,1)},uGrassGroundShadowStrength:{value:0}});Le(this,"interactive");Le(this,"baseWindStrength",.14);Le(this,"baseFlutterStrength",.035);Le(this,"artRootDarkening",.55);Le(this,"artTipColorStrength",.5);this.interactive=n.interactive===!0,this.uniforms.uGrassLodInvert.value=n.invertLodCoverage?1:0,this.uniforms.uGrassWindLodScale.value=n.windLodScale??1,this.uniforms.uGrassDetailMode.value=n.detailMode??0,this.uniforms.uGrassDitherSeed.value=(n.ditherSeed??0)/4294967296,this.setPaletteColors(),this.material=new Ss({side:Ft,color:16777215,transparent:!1,depthWrite:!0}),this.material.name=n.name;const t=n.vertexPalette===!0,i=n.worldLod!==!1,a=n.subPixelWidth===!0,o=n.sheen!==!1,s=n.noiseWind===!0,d=n.instanceFreeDither===!0,M=i?wp:Up;this.material.onBeforeCompile=g=>{Object.assign(g.uniforms,this.uniforms),g.vertexShader=g.vertexShader.replace("#include <common>",`#include <common>${Dp}${this.interactive?Lp:""}${i?"":Ip}${a?Pp:""}${s?Vp:""}${t?qp:yp}`).replace("#include <beginnormal_vertex>",`#include <beginnormal_vertex>${Np}`).replace("#include <begin_vertex>",`#include <begin_vertex>${Fp.replace("GRASS_KEEP_LOD",M).replace("GRASS_DITHER_INSTANCE_TERM",d?"":"instanceVariation.x +").replace("GRASS_GUST_NOISE",s?Bp:Hp).replace("GRASS_SHEEN_VARYING",o?Gp:Op).replace("GRASS_SUBPIXEL_WIDTH",a?Wp:"").replace("GRASS_TRAIL_BEND",this.interactive?zp:"").replace("GRASS_GROUND_SHADE_INIT",this.interactive?"vGrassGroundShade = 1.0;":"")}${t?Xp:kp}`),g.fragmentShader=g.fragmentShader.replace("#include <common>",`#include <common>${t?Zp:Yp}${this.interactive?Kp:""}`).replace("#include <color_fragment>",(t?jp:Qp).replace("GRASS_GROUND_SHADE_APPLY",this.interactive?$p:"")).replace("vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;",Jp.replace("GRASS_SHEEN_OUTPUT",o?eh:""))},this.material.customProgramCacheKey=()=>n.cacheKey}configure(n,t){this.colorControls.baseColor=n.baseColor,this.colorControls.tipColor=n.tipColor,this.colorControls.dryColor=n.dryColor,this.artRootDarkening=n.rootDarkening,this.setPaletteColors(),this.uniforms.uGrassNormalUp.value=n.normalUp,this.uniforms.uGrassAmbientBoost.value=n.ambientBoost,this.uniforms.uGrassBacklightStrength.value=n.backlightStrength,this.uniforms.uGrassWindDirection.value.set(t.directionX,t.directionZ).normalize(),this.baseWindStrength=t.strength,this.baseFlutterStrength=t.flutterStrength,this.uniforms.uGrassWindStrength.value=t.strength,this.uniforms.uGrassGustScale.value=t.gustScale,this.uniforms.uGrassGustSpeed.value=t.gustSpeed,this.uniforms.uGrassFlutterStrength.value=t.flutterStrength,this.uniforms.uGrassFlutterSpeed.value=t.flutterSpeed}applyArtDirection(n){this.colorControls.baseColor=n.baseColor,this.colorControls.tipColor=n.tipColor,this.colorControls.dryColor=n.dryColor,this.artRootDarkening=n.rootDarkening,this.artTipColorStrength=n.tipColorStrength,this.setPaletteColors(),this.uniforms.uGrassNormalUp.value=n.normalUp,this.uniforms.uGrassAmbientBoost.value=n.ambientBoost,this.uniforms.uGrassBacklightStrength.value=n.backlightStrength,this.uniforms.uGrassArtDensityScale.value=n.densityScale,this.uniforms.uGrassWindStrength.value=this.baseWindStrength*n.windStrengthScale,this.uniforms.uGrassFlutterStrength.value=this.baseFlutterStrength*n.flutterStrengthScale,this.configureGust(n.gustDepth??fr,n.gustTipBoost??Qa),this.uniforms.uGrassCanopyColor.value.set(n.terrainGrassColor),this.uniforms.uGrassSheenFadeDistance.value=n.nearDistance}setViewportPixelScale(n){Number.isFinite(n)&&n>0&&(this.uniforms.uGrassPixelWorldScale.value=n)}setBladeHalfWidth(n){const t=Math.max(n,1e-4);this.uniforms.uGrassBladeHalfWidth.value=t,this.uniforms.uGrassMaxWidenDistance.value=Math.min(t*Rp,ur)}getDitherSeed(){return this.uniforms.uGrassDitherSeed.value}setLodThreshold(n,t=1){this.uniforms.uGrassLodThreshold.value=n,this.uniforms.uGrassDistanceFade.value=t}configureLod(n){this.uniforms.uGrassNearDistance.value=n.nearMaxDistance,this.uniforms.uGrassMidDistance.value=n.midMaxDistance,this.uniforms.uGrassTransitionDistance.value=n.transitionDistance}configureDetailLod(n){this.uniforms.uGrassDetailNearDistance.value=n.nearMaxDistance,this.uniforms.uGrassDetailTransitionDistance.value=n.transitionDistance}update(n){if(this.uniforms.uGrassTime.value=n,!!this.interactive){if(ci.isEnabled()?(this.uniforms.uGrassGroundShadowDisc.value.copy(ci.disc),this.uniforms.uGrassGroundShadowStrength.value=ci.strength):this.uniforms.uGrassGroundShadowStrength.value=0,!wn.isEnabled()){this.uniforms.uGrassTrailStrength.value=0;return}this.uniforms.uGrassTrailMap.value=wn.getTexture(),this.uniforms.uGrassTrailCenter.value.copy(wn.getCenter()),this.uniforms.uGrassTrailInverseCoverage.value=wn.getInverseCoverage(),this.uniforms.uGrassTrailStrength.value=1}}configureTrail(n){this.uniforms.uGrassTrailMaxAngle.value=n.maxAngleRadians,this.uniforms.uGrassTrailWobbleFrequency.value=n.wobbleFrequency,this.uniforms.uGrassTrailWobbleAmplitude.value=n.wobbleAmplitude}setPaletteColors(){const n=this.uniforms.uGrassBiomeBase.value,t=this.uniforms.uGrassBiomeTip.value,i=this.uniforms.uGrassBiomeDry.value,a=this.uniforms.uGrassBiomeShade.value;lr(n[0],t[0],i[0],this.colorControls.baseColor,this.colorControls.tipColor,this.colorControls.dryColor),a[0].set(this.artRootDarkening,this.artTipColorStrength),this.uniforms.uGrassTipColor.value.copy(t[0]);for(let o=1;o<Vn;o+=1){const s=bs[o];if(!s||s.paletteSource==="art"){n[o].copy(n[0]),t[o].copy(t[0]),i[o].copy(i[0]),a[o].copy(a[0]);continue}lr(n[o],t[o],i[o],s.baseColor,s.tipColor,s.dryColor),a[o].set(s.rootDarkening,s.tipColorStrength)}}setWindNoise(n,t,i){this.uniforms.uGrassWindNoise.value=n,this.uniforms.uGrassWindNoiseScale.value=t,this.uniforms.uGrassWindNoiseSpeed.value=i}configureDensityFalloff(n,t,i){this.uniforms.uGrassDensityFalloffStart.value=n,this.uniforms.uGrassDensityFalloffEnd.value=t,this.uniforms.uGrassDensityFloor.value=i}getDensityFalloff(){return{start:this.uniforms.uGrassDensityFalloffStart.value,end:this.uniforms.uGrassDensityFalloffEnd.value,floor:this.uniforms.uGrassDensityFloor.value}}setLodDensityScale(n){this.uniforms.uGrassLodDensityScale.value=Dt.clamp(n,.05,1)}getLodDensityScale(){return this.uniforms.uGrassLodDensityScale.value}configureGust(n,t){this.uniforms.uGrassGustFrontDepth.value=n,this.uniforms.uGrassGustTipBoost.value=t}setSheenEnabled(n){this.uniforms.uGrassSheenStrength.value=n?cr:0}setupGUI(n,t=[]){const i=[this,...t],a=n.addFolder("Grass Props");a.addColor(this.colorControls,"baseColor").onChange(s=>{for(const d of i)d.colorControls.baseColor=s,d.setPaletteColors()}),a.addColor(this.colorControls,"tipColor").onChange(s=>{for(const d of i)d.colorControls.tipColor=s,d.setPaletteColors()}),a.addColor(this.colorControls,"dryColor").onChange(s=>{for(const d of i)d.colorControls.dryColor=s,d.setPaletteColors()});const o={value:this.artTipColorStrength};a.add(o,"value",.15,.75,.01).name("Tip Mix").onChange(s=>{for(const d of i)d.artTipColorStrength=s,d.setPaletteColors()}),a.add(this.uniforms.uGrassWindStrength,"value",0,.45,.005).name("Wind Strength").onChange(s=>{for(const d of t)d.uniforms.uGrassWindStrength.value=s}),a.add(this.uniforms.uGrassFlutterStrength,"value",0,.15,.0025).name("Tip Flutter").onChange(s=>{for(const d of t)d.uniforms.uGrassFlutterStrength.value=s}),a.add(this.uniforms.uGrassNormalUp,"value",0,.9,.01).name("Normal Up").onChange(s=>{for(const d of t)d.uniforms.uGrassNormalUp.value=s}),a.add(this.uniforms.uGrassAmbientBoost,"value",0,.4,.01).name("Ambient Boost").onChange(s=>{for(const d of t)d.uniforms.uGrassAmbientBoost.value=s}),a.add(this.uniforms.uGrassBacklightStrength,"value",0,.5,.01).name("Backlight").onChange(s=>{for(const d of t)d.uniforms.uGrassBacklightStrength.value=s}),a.add(this.uniforms.uGrassBladeCurvature,"value",0,1.2,.01).name("Blade Curve").onChange(s=>{for(const d of t)d.uniforms.uGrassBladeCurvature.value=s}),a.add(this.uniforms.uGrassSheenStrength,"value",0,.3,.005).name("Sheen").onChange(s=>{for(const d of t)d.uniforms.uGrassSheenStrength.value=s}),a.add(this.uniforms.uGrassSheenPower,"value",8,96,1).name("Sheen Focus").onChange(s=>{for(const d of t)d.uniforms.uGrassSheenPower.value=s}),a.add(this.uniforms.uGrassGustFrontDepth,"value",0,.9,.01).name("Gust Fronts").onChange(s=>{for(const d of t)d.uniforms.uGrassGustFrontDepth.value=s}),a.add(this.uniforms.uGrassGustFrontSpeed,"value",0,1.6,.01).name("Gust Speed").onChange(s=>{for(const d of t)d.uniforms.uGrassGustFrontSpeed.value=s}),a.open()}}const nh=.1;class Mh{constructor(){Le(this,"elapsedSeconds",0)}update(n){return!Number.isFinite(n)||n<=0?this.elapsedSeconds:(this.elapsedSeconds+=Math.min(n,nh),this.elapsedSeconds)}}function Th(){const e=Math.max(1,window.innerWidth),n=Math.max(1,window.innerHeight);return{width:e,height:n,aspect:e/n}}function Ah(e){const n=window.devicePixelRatio,t=Number.isFinite(n)&&n>0?n:1;return Math.min(t,e)}export{Kd as A,Yd as B,vh as C,Eh as D,Sh as E,lh as G,Aa as P,Rd as S,le as U,Mh as W,ch as a,xh as b,_h as c,gh as d,vt as e,sh as f,Ah as g,ci as h,wn as i,Xa as j,xd as k,uh as l,hh as m,mh as n,dh as o,fh as p,Qa as q,Th as r,lr as s,qd as t,Xd as u,Pd as v,Hr as w,gp as x,ep as y,ph as z};
