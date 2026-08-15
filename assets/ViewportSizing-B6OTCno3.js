var ao=Object.defineProperty;var ro=(e,n,t)=>n in e?ao(e,n,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[n]=t;var Ue=(e,n,t)=>ro(e,typeof n!="symbol"?n+"":n,t);import{aF as Ct,aP as oo,aQ as Ht,j as so,h as Ye,aR as lo,aS as je,aT as Ve,aG as ht,aU as Vi,m as an,aV as bi,aW as Wi,aX as wt,ad as Je,r as fn,aY as Vt,H as Ot,aA as bt,ae as Tn,V as ye,aZ as co,a_ as An,U as Pn,az as Jt,a$ as fo,X as Wt,a2 as Ri,b0 as Ze,b1 as uo,a1 as Gn,b2 as po,b3 as Zn,a as it,aE as Bt,b4 as un,b5 as pn,b6 as bn,b7 as rn,b8 as ho,aD as vr,b9 as on,u as gt,y as Rn,aj as Ne,ba as mo,aC as $t,bb as ki,bc as _o,bd as go,be as gn,bf as vo,bg as So,bh as Eo,bi as xo,bj as Mo,bk as To,bl as Ao,bm as bo,bn as Ro,bo as Co,bp as Do,bq as Po,br as wo,bs as Lo,bt as Uo,x as yo,w as vi,s as jn,N as Un,t as Io,v as tn,bu as No,bv as Fo,bw as Ci,bx as Go,by as Di,bz as Oo,bA as Bo,bB as Ho,P as Vo,bC as Wo,bD as ko,aJ as kt,B as On,bE as Bn,aO as zo,bF as zt,bG as En,bH as Zt,bI as Xo,bJ as Sr,bK as Er,bL as xr,bM as Wn,bN as Mr,bO as Tr,bP as Ar,aM as Pi,bQ as Cn,bR as hn,at as wi,J as qo,bS as Yo,bT as Ko,bU as $o,bV as Zo,bW as br,bX as jo,bY as Qo,bZ as Jo,b_ as Qn,b$ as Jn,c0 as ei,c1 as ti,c2 as zi,c3 as Xi,c4 as qi,c5 as Yi,c6 as Ki,c7 as $i,c8 as Zi,c9 as ji,ca as Qi,cb as Si,cc as Ji,cd as ea,ce as ta,cf as na,cg as ia,ch as aa,ci as ra,cj as oa,ck as sa,cl as la,cm as ca,cn as fa,co as ua,cp as da,cq as pa,cr as ha,cs as ma,ct as _a,cu as ga,cv as va,cw as Ei,cx as Sa,cy as es,cz as ts,cA as ns,cB as is,cC as as,cD as rs,cE as os,cF as ss,cG as Ea,cH as ls,cI as Hn,cJ as cs,cK as xa,cL as Ma,cM as Ta,cN as Rr,aI as fs,cO as Xn,cP as Aa,cQ as us,cR as Cr,cS as xi,cT as Dr,cU as ds,cV as Pr,cW as wr,cX as Lr,al as Ur,cY as yr,cZ as Ir,c_ as Nr,i as Fr,c$ as ba,d0 as Gr,d1 as ni,d2 as ii,d3 as ps,d4 as hs,d5 as Ra,d6 as Mt,d7 as ms,d8 as _s,d9 as gs,da as vs,db as Ss,dc as Es,a9 as xs,dd as Ms,de as Ts,df as As,aK as bs,n as ai,b as Pt,an as Rs,aB as Cs}from"./three.core-CjlvuMMb.js";import{F as Ds,b as Ps,P as _t,c as ws,a as Kt,N as It,U as Ls}from"./index-CoStPljz.js";/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function Or(){let e=null,n=!1,t=null,i=null;function a(o,s){t(o,s),i=e.requestAnimationFrame(a)}return{start:function(){n!==!0&&t!==null&&e!==null&&(i=e.requestAnimationFrame(a),n=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(i),n=!1},setAnimationLoop:function(o){t=o},setContext:function(o){e=o}}}function Us(e){const n=new WeakMap;function t(d,T){const v=d.array,G=d.usage,R=v.byteLength,h=e.createBuffer();e.bindBuffer(T,h),e.bufferData(T,v,G),d.onUploadCallback();let S;if(v instanceof Float32Array)S=e.FLOAT;else if(typeof Float16Array<"u"&&v instanceof Float16Array)S=e.HALF_FLOAT;else if(v instanceof Uint16Array)d.isFloat16BufferAttribute?S=e.HALF_FLOAT:S=e.UNSIGNED_SHORT;else if(v instanceof Int16Array)S=e.SHORT;else if(v instanceof Uint32Array)S=e.UNSIGNED_INT;else if(v instanceof Int32Array)S=e.INT;else if(v instanceof Int8Array)S=e.BYTE;else if(v instanceof Uint8Array)S=e.UNSIGNED_BYTE;else if(v instanceof Uint8ClampedArray)S=e.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+v);return{buffer:h,type:S,bytesPerElement:v.BYTES_PER_ELEMENT,version:d.version,size:R}}function i(d,T,v){const G=T.array,R=T.updateRanges;if(e.bindBuffer(v,d),R.length===0)e.bufferSubData(v,0,G);else{R.sort((S,C)=>S.start-C.start);let h=0;for(let S=1;S<R.length;S++){const C=R[h],B=R[S];B.start<=C.start+C.count+1?C.count=Math.max(C.count,B.start+B.count-C.start):(++h,R[h]=B)}R.length=h+1;for(let S=0,C=R.length;S<C;S++){const B=R[S];e.bufferSubData(v,B.start*G.BYTES_PER_ELEMENT,G,B.start,B.count)}T.clearUpdateRanges()}T.onUploadCallback()}function a(d){return d.isInterleavedBufferAttribute&&(d=d.data),n.get(d)}function o(d){d.isInterleavedBufferAttribute&&(d=d.data);const T=n.get(d);T&&(e.deleteBuffer(T.buffer),n.delete(d))}function s(d,T){if(d.isInterleavedBufferAttribute&&(d=d.data),d.isGLBufferAttribute){const G=n.get(d);(!G||G.version<d.version)&&n.set(d,{buffer:d.buffer,type:d.type,bytesPerElement:d.elementSize,version:d.version});return}const v=n.get(d);if(v===void 0)n.set(d,t(d,T));else if(v.version<d.version){if(v.size!==d.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(v.buffer,d,T),v.version=d.version}}return{get:a,remove:o,update:s}}var ys=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Is=`#ifdef USE_ALPHAHASH
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
#endif`,Ns=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Fs=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Gs=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Os=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Bs=`#ifdef USE_AOMAP
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
#endif`,Hs=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Vs=`#ifdef USE_BATCHING
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
#endif`,Ws=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,ks=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,zs=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Xs=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,qs=`#ifdef USE_IRIDESCENCE
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
#endif`,Ys=`#ifdef USE_BUMPMAP
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
#endif`,Ks=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,$s=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Zs=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,js=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Qs=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Js=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,el=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,tl=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,nl=`#define PI 3.141592653589793
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
} // validated`,il=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,al=`vec3 transformedNormal = objectNormal;
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
#endif`,rl=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,ol=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,sl=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,ll=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,cl="gl_FragColor = linearToOutputTexel( gl_FragColor );",fl=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,ul=`#ifdef USE_ENVMAP
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
#endif`,dl=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,pl=`#ifdef USE_ENVMAP
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
#endif`,hl=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,ml=`#ifdef USE_ENVMAP
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
#endif`,_l=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,gl=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,vl=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Sl=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,El=`#ifdef USE_GRADIENTMAP
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
}`,xl=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Ml=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Tl=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Al=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,bl=`#ifdef USE_ENVMAP
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
#endif`,Rl=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Cl=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Dl=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Pl=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,wl=`PhysicalMaterial material;
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
#endif`,Ll=`uniform sampler2D dfgLUT;
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
}`,Ul=`
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
#endif`,yl=`#if defined( RE_IndirectDiffuse )
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
#endif`,Il=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Nl=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,Fl=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Gl=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ol=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Bl=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Hl=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Vl=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Wl=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,kl=`#if defined( USE_POINTS_UV )
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
#endif`,zl=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Xl=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,ql=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Yl=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Kl=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,$l=`#ifdef USE_MORPHTARGETS
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
#endif`,Zl=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,jl=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Ql=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Jl=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,ec=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,tc=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,nc=`#ifdef USE_NORMALMAP
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
#endif`,ic=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,ac=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,rc=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,oc=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,sc=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,lc=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,cc=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,fc=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,uc=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dc=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,pc=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,hc=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,mc=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,_c=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,gc=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,vc=`float getShadowMask() {
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
}`,Sc=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Ec=`#ifdef USE_SKINNING
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
#endif`,xc=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Mc=`#ifdef USE_SKINNING
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
#endif`,Tc=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Ac=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,bc=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Rc=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Cc=`#ifdef USE_TRANSMISSION
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
#endif`,Dc=`#ifdef USE_TRANSMISSION
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
#endif`,Pc=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,wc=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Lc=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Uc=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const yc=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Ic=`uniform sampler2D t2D;
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
}`,Nc=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Fc=`#ifdef ENVMAP_TYPE_CUBE
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
}`,Gc=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Oc=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Bc=`#include <common>
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
}`,Hc=`#if DEPTH_PACKING == 3200
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
}`,Vc=`#define DISTANCE
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
}`,Wc=`#define DISTANCE
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
}`,kc=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,zc=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Xc=`uniform float scale;
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
}`,qc=`uniform vec3 diffuse;
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
}`,Yc=`#include <common>
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
}`,Kc=`uniform vec3 diffuse;
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
}`,$c=`#define LAMBERT
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
}`,Zc=`#define LAMBERT
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
}`,jc=`#define MATCAP
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
}`,Qc=`#define MATCAP
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
}`,Jc=`#define NORMAL
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
}`,ef=`#define NORMAL
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
}`,tf=`#define PHONG
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
}`,nf=`#define PHONG
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
}`,af=`#define STANDARD
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
}`,rf=`#define STANDARD
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
}`,of=`#define TOON
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
}`,sf=`#define TOON
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
}`,lf=`uniform float size;
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
}`,cf=`uniform vec3 diffuse;
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
}`,ff=`#include <common>
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
}`,uf=`uniform vec3 color;
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
}`,df=`uniform float rotation;
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
}`,pf=`uniform vec3 diffuse;
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
}`,we={alphahash_fragment:ys,alphahash_pars_fragment:Is,alphamap_fragment:Ns,alphamap_pars_fragment:Fs,alphatest_fragment:Gs,alphatest_pars_fragment:Os,aomap_fragment:Bs,aomap_pars_fragment:Hs,batching_pars_vertex:Vs,batching_vertex:Ws,begin_vertex:ks,beginnormal_vertex:zs,bsdfs:Xs,iridescence_fragment:qs,bumpmap_pars_fragment:Ys,clipping_planes_fragment:Ks,clipping_planes_pars_fragment:$s,clipping_planes_pars_vertex:Zs,clipping_planes_vertex:js,color_fragment:Qs,color_pars_fragment:Js,color_pars_vertex:el,color_vertex:tl,common:nl,cube_uv_reflection_fragment:il,defaultnormal_vertex:al,displacementmap_pars_vertex:rl,displacementmap_vertex:ol,emissivemap_fragment:sl,emissivemap_pars_fragment:ll,colorspace_fragment:cl,colorspace_pars_fragment:fl,envmap_fragment:ul,envmap_common_pars_fragment:dl,envmap_pars_fragment:pl,envmap_pars_vertex:hl,envmap_physical_pars_fragment:bl,envmap_vertex:ml,fog_vertex:_l,fog_pars_vertex:gl,fog_fragment:vl,fog_pars_fragment:Sl,gradientmap_pars_fragment:El,lightmap_pars_fragment:xl,lights_lambert_fragment:Ml,lights_lambert_pars_fragment:Tl,lights_pars_begin:Al,lights_toon_fragment:Rl,lights_toon_pars_fragment:Cl,lights_phong_fragment:Dl,lights_phong_pars_fragment:Pl,lights_physical_fragment:wl,lights_physical_pars_fragment:Ll,lights_fragment_begin:Ul,lights_fragment_maps:yl,lights_fragment_end:Il,lightprobes_pars_fragment:Nl,logdepthbuf_fragment:Fl,logdepthbuf_pars_fragment:Gl,logdepthbuf_pars_vertex:Ol,logdepthbuf_vertex:Bl,map_fragment:Hl,map_pars_fragment:Vl,map_particle_fragment:Wl,map_particle_pars_fragment:kl,metalnessmap_fragment:zl,metalnessmap_pars_fragment:Xl,morphinstance_vertex:ql,morphcolor_vertex:Yl,morphnormal_vertex:Kl,morphtarget_pars_vertex:$l,morphtarget_vertex:Zl,normal_fragment_begin:jl,normal_fragment_maps:Ql,normal_pars_fragment:Jl,normal_pars_vertex:ec,normal_vertex:tc,normalmap_pars_fragment:nc,clearcoat_normal_fragment_begin:ic,clearcoat_normal_fragment_maps:ac,clearcoat_pars_fragment:rc,iridescence_pars_fragment:oc,opaque_fragment:sc,packing:lc,premultiplied_alpha_fragment:cc,project_vertex:fc,dithering_fragment:uc,dithering_pars_fragment:dc,roughnessmap_fragment:pc,roughnessmap_pars_fragment:hc,shadowmap_pars_fragment:mc,shadowmap_pars_vertex:_c,shadowmap_vertex:gc,shadowmask_pars_fragment:vc,skinbase_vertex:Sc,skinning_pars_vertex:Ec,skinning_vertex:xc,skinnormal_vertex:Mc,specularmap_fragment:Tc,specularmap_pars_fragment:Ac,tonemapping_fragment:bc,tonemapping_pars_fragment:Rc,transmission_fragment:Cc,transmission_pars_fragment:Dc,uv_pars_fragment:Pc,uv_pars_vertex:wc,uv_vertex:Lc,worldpos_vertex:Uc,background_vert:yc,background_frag:Ic,backgroundCube_vert:Nc,backgroundCube_frag:Fc,cube_vert:Gc,cube_frag:Oc,depth_vert:Bc,depth_frag:Hc,distance_vert:Vc,distance_frag:Wc,equirect_vert:kc,equirect_frag:zc,linedashed_vert:Xc,linedashed_frag:qc,meshbasic_vert:Yc,meshbasic_frag:Kc,meshlambert_vert:$c,meshlambert_frag:Zc,meshmatcap_vert:jc,meshmatcap_frag:Qc,meshnormal_vert:Jc,meshnormal_frag:ef,meshphong_vert:tf,meshphong_frag:nf,meshphysical_vert:af,meshphysical_frag:rf,meshtoon_vert:of,meshtoon_frag:sf,points_vert:lf,points_frag:cf,shadow_vert:ff,shadow_frag:uf,sprite_vert:df,sprite_frag:pf},le={common:{diffuse:{value:new Ye(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ne},alphaMap:{value:null},alphaMapTransform:{value:new Ne},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ne}},envmap:{envMap:{value:null},envMapRotation:{value:new Ne},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ne}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ne}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ne},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ne},normalScale:{value:new it(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ne},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ne}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ne}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ne}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ye(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new ye},probesMax:{value:new ye},probesResolution:{value:new ye}},points:{diffuse:{value:new Ye(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ne},alphaTest:{value:0},uvTransform:{value:new Ne}},sprite:{diffuse:{value:new Ye(16777215)},opacity:{value:1},center:{value:new it(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ne},alphaMap:{value:null},alphaMapTransform:{value:new Ne},alphaTest:{value:0}}},Gt={basic:{uniforms:Mt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.fog]),vertexShader:we.meshbasic_vert,fragmentShader:we.meshbasic_frag},lambert:{uniforms:Mt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new Ye(0)},envMapIntensity:{value:1}}]),vertexShader:we.meshlambert_vert,fragmentShader:we.meshlambert_frag},phong:{uniforms:Mt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new Ye(0)},specular:{value:new Ye(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:we.meshphong_vert,fragmentShader:we.meshphong_frag},standard:{uniforms:Mt([le.common,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.roughnessmap,le.metalnessmap,le.fog,le.lights,{emissive:{value:new Ye(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:we.meshphysical_vert,fragmentShader:we.meshphysical_frag},toon:{uniforms:Mt([le.common,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.gradientmap,le.fog,le.lights,{emissive:{value:new Ye(0)}}]),vertexShader:we.meshtoon_vert,fragmentShader:we.meshtoon_frag},matcap:{uniforms:Mt([le.common,le.bumpmap,le.normalmap,le.displacementmap,le.fog,{matcap:{value:null}}]),vertexShader:we.meshmatcap_vert,fragmentShader:we.meshmatcap_frag},points:{uniforms:Mt([le.points,le.fog]),vertexShader:we.points_vert,fragmentShader:we.points_frag},dashed:{uniforms:Mt([le.common,le.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:we.linedashed_vert,fragmentShader:we.linedashed_frag},depth:{uniforms:Mt([le.common,le.displacementmap]),vertexShader:we.depth_vert,fragmentShader:we.depth_frag},normal:{uniforms:Mt([le.common,le.bumpmap,le.normalmap,le.displacementmap,{opacity:{value:1}}]),vertexShader:we.meshnormal_vert,fragmentShader:we.meshnormal_frag},sprite:{uniforms:Mt([le.sprite,le.fog]),vertexShader:we.sprite_vert,fragmentShader:we.sprite_frag},background:{uniforms:{uvTransform:{value:new Ne},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:we.background_vert,fragmentShader:we.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ne}},vertexShader:we.backgroundCube_vert,fragmentShader:we.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:we.cube_vert,fragmentShader:we.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:we.equirect_vert,fragmentShader:we.equirect_frag},distance:{uniforms:Mt([le.common,le.displacementmap,{referencePosition:{value:new ye},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:we.distance_vert,fragmentShader:we.distance_frag},shadow:{uniforms:Mt([le.lights,le.fog,{color:{value:new Ye(0)},opacity:{value:1}}]),vertexShader:we.shadow_vert,fragmentShader:we.shadow_frag}};Gt.physical={uniforms:Mt([Gt.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ne},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ne},clearcoatNormalScale:{value:new it(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ne},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ne},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ne},sheen:{value:0},sheenColor:{value:new Ye(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ne},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ne},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ne},transmissionSamplerSize:{value:new it},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ne},attenuationDistance:{value:0},attenuationColor:{value:new Ye(0)},specularColor:{value:new Ye(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ne},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ne},anisotropyVector:{value:new it},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ne}}]),vertexShader:we.meshphysical_vert,fragmentShader:we.meshphysical_frag};const yn={r:0,b:0,g:0},hf=new an,Br=new Ne;Br.set(-1,0,0,0,1,0,0,0,1);function mf(e,n,t,i,a,o){const s=new Ye(0);let d=a===!0?0:1,T,v,G=null,R=0,h=null;function S(y){let I=y.isScene===!0?y.background:null;if(I&&I.isTexture){const m=y.backgroundBlurriness>0;I=n.get(I,m)}return I}function C(y){let I=!1;const m=S(y);m===null?u(s,d):m&&m.isColor&&(u(m,1),I=!0);const A=e.xr.getEnvironmentBlendMode();A==="additive"?t.buffers.color.setClear(0,0,0,1,o):A==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,o),(e.autoClear||I)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function B(y,I){const m=S(I);m&&(m.isCubeTexture||m.mapping===Xn)?(v===void 0&&(v=new Wt(new wi(1,1,1),new kt({name:"BackgroundCubeMaterial",uniforms:xi(Gt.backgroundCube.uniforms),vertexShader:Gt.backgroundCube.vertexShader,fragmentShader:Gt.backgroundCube.fragmentShader,side:bt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),v.geometry.deleteAttribute("normal"),v.geometry.deleteAttribute("uv"),v.onBeforeRender=function(A,g,P){this.matrixWorld.copyPosition(P.matrixWorld)},Object.defineProperty(v.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(v)),v.material.uniforms.envMap.value=m,v.material.uniforms.backgroundBlurriness.value=I.backgroundBlurriness,v.material.uniforms.backgroundIntensity.value=I.backgroundIntensity,v.material.uniforms.backgroundRotation.value.setFromMatrix4(hf.makeRotationFromEuler(I.backgroundRotation)).transpose(),m.isCubeTexture&&m.isRenderTargetTexture===!1&&v.material.uniforms.backgroundRotation.value.premultiply(Br),v.material.toneMapped=Je.getTransfer(m.colorSpace)!==Ze,(G!==m||R!==m.version||h!==e.toneMapping)&&(v.material.needsUpdate=!0,G=m,R=m.version,h=e.toneMapping),v.layers.enableAll(),y.unshift(v,v.geometry,v.material,0,0,null)):m&&m.isTexture&&(T===void 0&&(T=new Wt(new Pi(2,2),new kt({name:"BackgroundMaterial",uniforms:xi(Gt.background.uniforms),vertexShader:Gt.background.vertexShader,fragmentShader:Gt.background.fragmentShader,side:Tn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),T.geometry.deleteAttribute("normal"),Object.defineProperty(T.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(T)),T.material.uniforms.t2D.value=m,T.material.uniforms.backgroundIntensity.value=I.backgroundIntensity,T.material.toneMapped=Je.getTransfer(m.colorSpace)!==Ze,m.matrixAutoUpdate===!0&&m.updateMatrix(),T.material.uniforms.uvTransform.value.copy(m.matrix),(G!==m||R!==m.version||h!==e.toneMapping)&&(T.material.needsUpdate=!0,G=m,R=m.version,h=e.toneMapping),T.layers.enableAll(),y.unshift(T,T.geometry,T.material,0,0,null))}function u(y,I){y.getRGB(yn,Cr(e)),t.buffers.color.setClear(yn.r,yn.g,yn.b,I,o)}function c(){v!==void 0&&(v.geometry.dispose(),v.material.dispose(),v=void 0),T!==void 0&&(T.geometry.dispose(),T.material.dispose(),T=void 0)}return{getClearColor:function(){return s},setClearColor:function(y,I=1){s.set(y),d=I,u(s,d)},getClearAlpha:function(){return d},setClearAlpha:function(y){d=y,u(s,d)},render:C,addToRenderList:B,dispose:c}}function _f(e,n){const t=e.getParameter(e.MAX_VERTEX_ATTRIBS),i={},a=h(null);let o=a,s=!1;function d(D,O,j,K,k){let q=!1;const V=R(D,K,j,O);o!==V&&(o=V,v(o.object)),q=S(D,K,j,k),q&&C(D,K,j,k),k!==null&&n.update(k,e.ELEMENT_ARRAY_BUFFER),(q||s)&&(s=!1,m(D,O,j,K),k!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,n.get(k).buffer))}function T(){return e.createVertexArray()}function v(D){return e.bindVertexArray(D)}function G(D){return e.deleteVertexArray(D)}function R(D,O,j,K){const k=K.wireframe===!0;let q=i[O.id];q===void 0&&(q={},i[O.id]=q);const V=D.isInstancedMesh===!0?D.id:0;let Z=q[V];Z===void 0&&(Z={},q[V]=Z);let ee=Z[j.id];ee===void 0&&(ee={},Z[j.id]=ee);let ce=ee[k];return ce===void 0&&(ce=h(T()),ee[k]=ce),ce}function h(D){const O=[],j=[],K=[];for(let k=0;k<t;k++)O[k]=0,j[k]=0,K[k]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:O,enabledAttributes:j,attributeDivisors:K,object:D,attributes:{},index:null}}function S(D,O,j,K){const k=o.attributes,q=O.attributes;let V=0;const Z=j.getAttributes();for(const ee in Z)if(Z[ee].location>=0){const _e=k[ee];let ve=q[ee];if(ve===void 0&&(ee==="instanceMatrix"&&D.instanceMatrix&&(ve=D.instanceMatrix),ee==="instanceColor"&&D.instanceColor&&(ve=D.instanceColor)),_e===void 0||_e.attribute!==ve||ve&&_e.data!==ve.data)return!0;V++}return o.attributesNum!==V||o.index!==K}function C(D,O,j,K){const k={},q=O.attributes;let V=0;const Z=j.getAttributes();for(const ee in Z)if(Z[ee].location>=0){let _e=q[ee];_e===void 0&&(ee==="instanceMatrix"&&D.instanceMatrix&&(_e=D.instanceMatrix),ee==="instanceColor"&&D.instanceColor&&(_e=D.instanceColor));const ve={};ve.attribute=_e,_e&&_e.data&&(ve.data=_e.data),k[ee]=ve,V++}o.attributes=k,o.attributesNum=V,o.index=K}function B(){const D=o.newAttributes;for(let O=0,j=D.length;O<j;O++)D[O]=0}function u(D){c(D,0)}function c(D,O){const j=o.newAttributes,K=o.enabledAttributes,k=o.attributeDivisors;j[D]=1,K[D]===0&&(e.enableVertexAttribArray(D),K[D]=1),k[D]!==O&&(e.vertexAttribDivisor(D,O),k[D]=O)}function y(){const D=o.newAttributes,O=o.enabledAttributes;for(let j=0,K=O.length;j<K;j++)O[j]!==D[j]&&(e.disableVertexAttribArray(j),O[j]=0)}function I(D,O,j,K,k,q,V){V===!0?e.vertexAttribIPointer(D,O,j,k,q):e.vertexAttribPointer(D,O,j,K,k,q)}function m(D,O,j,K){B();const k=K.attributes,q=j.getAttributes(),V=O.defaultAttributeValues;for(const Z in q){const ee=q[Z];if(ee.location>=0){let ce=k[Z];if(ce===void 0&&(Z==="instanceMatrix"&&D.instanceMatrix&&(ce=D.instanceMatrix),Z==="instanceColor"&&D.instanceColor&&(ce=D.instanceColor)),ce!==void 0){const _e=ce.normalized,ve=ce.itemSize,Oe=n.get(ce);if(Oe===void 0)continue;const Qe=Oe.buffer,Be=Oe.type,z=Oe.bytesPerElement,ne=Be===e.INT||Be===e.UNSIGNED_INT||ce.gpuType===br;if(ce.isInterleavedBufferAttribute){const Q=ce.data,Re=Q.stride,Ce=ce.offset;if(Q.isInstancedInterleavedBuffer){for(let Ae=0;Ae<ee.locationSize;Ae++)c(ee.location+Ae,Q.meshPerAttribute);D.isInstancedMesh!==!0&&K._maxInstanceCount===void 0&&(K._maxInstanceCount=Q.meshPerAttribute*Q.count)}else for(let Ae=0;Ae<ee.locationSize;Ae++)u(ee.location+Ae);e.bindBuffer(e.ARRAY_BUFFER,Qe);for(let Ae=0;Ae<ee.locationSize;Ae++)I(ee.location+Ae,ve/ee.locationSize,Be,_e,Re*z,(Ce+ve/ee.locationSize*Ae)*z,ne)}else{if(ce.isInstancedBufferAttribute){for(let Q=0;Q<ee.locationSize;Q++)c(ee.location+Q,ce.meshPerAttribute);D.isInstancedMesh!==!0&&K._maxInstanceCount===void 0&&(K._maxInstanceCount=ce.meshPerAttribute*ce.count)}else for(let Q=0;Q<ee.locationSize;Q++)u(ee.location+Q);e.bindBuffer(e.ARRAY_BUFFER,Qe);for(let Q=0;Q<ee.locationSize;Q++)I(ee.location+Q,ve/ee.locationSize,Be,_e,ve*z,ve/ee.locationSize*Q*z,ne)}}else if(V!==void 0){const _e=V[Z];if(_e!==void 0)switch(_e.length){case 2:e.vertexAttrib2fv(ee.location,_e);break;case 3:e.vertexAttrib3fv(ee.location,_e);break;case 4:e.vertexAttrib4fv(ee.location,_e);break;default:e.vertexAttrib1fv(ee.location,_e)}}}}y()}function A(){_();for(const D in i){const O=i[D];for(const j in O){const K=O[j];for(const k in K){const q=K[k];for(const V in q)G(q[V].object),delete q[V];delete K[k]}}delete i[D]}}function g(D){if(i[D.id]===void 0)return;const O=i[D.id];for(const j in O){const K=O[j];for(const k in K){const q=K[k];for(const V in q)G(q[V].object),delete q[V];delete K[k]}}delete i[D.id]}function P(D){for(const O in i){const j=i[O];for(const K in j){const k=j[K];if(k[D.id]===void 0)continue;const q=k[D.id];for(const V in q)G(q[V].object),delete q[V];delete k[D.id]}}}function f(D){for(const O in i){const j=i[O],K=D.isInstancedMesh===!0?D.id:0,k=j[K];if(k!==void 0){for(const q in k){const V=k[q];for(const Z in V)G(V[Z].object),delete V[Z];delete k[q]}delete j[K],Object.keys(j).length===0&&delete i[O]}}}function _(){N(),s=!0,o!==a&&(o=a,v(o.object))}function N(){a.geometry=null,a.program=null,a.wireframe=!1}return{setup:d,reset:_,resetDefaultState:N,dispose:A,releaseStatesOfGeometry:g,releaseStatesOfObject:f,releaseStatesOfProgram:P,initAttributes:B,enableAttribute:u,disableUnusedAttributes:y}}function gf(e,n,t){let i;function a(T){i=T}function o(T,v){e.drawArrays(i,T,v),t.update(v,i,1)}function s(T,v,G){G!==0&&(e.drawArraysInstanced(i,T,v,G),t.update(v,i,G))}function d(T,v,G){if(G===0)return;n.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,T,0,v,0,G);let h=0;for(let S=0;S<G;S++)h+=v[S];t.update(h,i,1)}this.setMode=a,this.render=o,this.renderInstances=s,this.renderMultiDraw=d}function vf(e,n,t,i){let a;function o(){if(a!==void 0)return a;if(n.has("EXT_texture_filter_anisotropic")===!0){const P=n.get("EXT_texture_filter_anisotropic");a=e.getParameter(P.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else a=0;return a}function s(P){return!(P!==Bt&&i.convert(P)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))}function d(P){const f=P===Vt&&(n.has("EXT_color_buffer_half_float")||n.has("EXT_color_buffer_float"));return!(P!==Ct&&i.convert(P)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE)&&P!==Zt&&!f)}function T(P){if(P==="highp"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return"highp";P="mediump"}return P==="mediump"&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let v=t.precision!==void 0?t.precision:"highp";const G=T(v);G!==v&&(Ve("WebGLRenderer:",v,"not supported, using",G,"instead."),v=G);const R=t.logarithmicDepthBuffer===!0,h=t.reversedDepthBuffer===!0&&n.has("EXT_clip_control");t.reversedDepthBuffer===!0&&h===!1&&Ve("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const S=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),C=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),B=e.getParameter(e.MAX_TEXTURE_SIZE),u=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),c=e.getParameter(e.MAX_VERTEX_ATTRIBS),y=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),I=e.getParameter(e.MAX_VARYING_VECTORS),m=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),A=e.getParameter(e.MAX_SAMPLES),g=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:o,getMaxPrecision:T,textureFormatReadable:s,textureTypeReadable:d,precision:v,logarithmicDepthBuffer:R,reversedDepthBuffer:h,maxTextures:S,maxVertexTextures:C,maxTextureSize:B,maxCubemapSize:u,maxAttributes:c,maxVertexUniforms:y,maxVaryings:I,maxFragmentUniforms:m,maxSamples:A,samples:g}}function Sf(e){const n=this;let t=null,i=0,a=!1,o=!1;const s=new Vo,d=new Ne,T={value:null,needsUpdate:!1};this.uniform=T,this.numPlanes=0,this.numIntersection=0,this.init=function(R,h){const S=R.length!==0||h||i!==0||a;return a=h,i=R.length,S},this.beginShadows=function(){o=!0,G(null)},this.endShadows=function(){o=!1},this.setGlobalState=function(R,h){t=G(R,h,0)},this.setState=function(R,h,S){const C=R.clippingPlanes,B=R.clipIntersection,u=R.clipShadows,c=e.get(R);if(!a||C===null||C.length===0||o&&!u)o?G(null):v();else{const y=o?0:i,I=y*4;let m=c.clippingState||null;T.value=m,m=G(C,h,I,S);for(let A=0;A!==I;++A)m[A]=t[A];c.clippingState=m,this.numIntersection=B?this.numPlanes:0,this.numPlanes+=y}};function v(){T.value!==t&&(T.value=t,T.needsUpdate=i>0),n.numPlanes=i,n.numIntersection=0}function G(R,h,S,C){const B=R!==null?R.length:0;let u=null;if(B!==0){if(u=T.value,C!==!0||u===null){const c=S+B*4,y=h.matrixWorldInverse;d.getNormalMatrix(y),(u===null||u.length<c)&&(u=new Float32Array(c));for(let I=0,m=S;I!==B;++I,m+=4)s.copy(R[I]).applyMatrix4(y,d),s.normal.toArray(u,m),u[m+3]=s.constant}T.value=u,T.needsUpdate=!0}return n.numPlanes=B,n.numIntersection=0,u}}const jt=4,Ca=[.125,.215,.35,.446,.526,.582],en=20,Ef=256,vn=new Ri,Da=new Ye;let ri=null,oi=0,si=0,li=!1;const xf=new ye;class Pa{constructor(n){this._renderer=n,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(n,t=0,i=.1,a=100,o={}){const{size:s=256,position:d=xf}=o;ri=this._renderer.getRenderTarget(),oi=this._renderer.getActiveCubeFace(),si=this._renderer.getActiveMipmapLevel(),li=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(s);const T=this._allocateTargets();return T.depthBuffer=!0,this._sceneToCubeUV(n,i,a,T,d),t>0&&this._blur(T,0,0,t),this._applyPMREM(T),this._cleanup(T),T}fromEquirectangular(n,t=null){return this._fromTexture(n,t)}fromCubemap(n,t=null){return this._fromTexture(n,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Ua(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=La(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(n){this._lodMax=Math.floor(Math.log2(n)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let n=0;n<this._lodMeshes.length;n++)this._lodMeshes[n].geometry.dispose()}_cleanup(n){this._renderer.setRenderTarget(ri,oi,si),this._renderer.xr.enabled=li,n.scissorTest=!1,cn(n,0,0,n.width,n.height)}_fromTexture(n,t){n.mapping===Cn||n.mapping===hn?this._setSize(n.image.length===0?16:n.image[0].width||n.image[0].image.width):this._setSize(n.image.width/4),ri=this._renderer.getRenderTarget(),oi=this._renderer.getActiveCubeFace(),si=this._renderer.getActiveMipmapLevel(),li=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=t||this._allocateTargets();return this._textureToCubeUV(n,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const n=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:gt,minFilter:gt,generateMipmaps:!1,type:Vt,format:Bt,colorSpace:Fr,depthBuffer:!1},a=wa(n,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==n||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=wa(n,t,i);const{_lodMax:o}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=Mf(o)),this._blurMaterial=Af(o,n,t),this._ggxMaterial=Tf(o,n,t)}return a}_compileMaterial(n){const t=new Wt(new Pn,n);this._renderer.compile(t,vn)}_sceneToCubeUV(n,t,i,a,o){const T=new Gn(90,1,t,i),v=[1,-1,1,1,1,1],G=[1,1,1,-1,-1,-1],R=this._renderer,h=R.autoClear,S=R.toneMapping;R.getClearColor(Da),R.toneMapping=Ht,R.autoClear=!1,R.state.buffers.depth.getReversed()&&(R.setRenderTarget(a),R.clearDepth(),R.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Wt(new wi,new qo({name:"PMREM.Background",side:bt,depthWrite:!1,depthTest:!1})));const B=this._backgroundBox,u=B.material;let c=!1;const y=n.background;y?y.isColor&&(u.color.copy(y),n.background=null,c=!0):(u.color.copy(Da),c=!0);for(let I=0;I<6;I++){const m=I%3;m===0?(T.up.set(0,v[I],0),T.position.set(o.x,o.y,o.z),T.lookAt(o.x+G[I],o.y,o.z)):m===1?(T.up.set(0,0,v[I]),T.position.set(o.x,o.y,o.z),T.lookAt(o.x,o.y+G[I],o.z)):(T.up.set(0,v[I],0),T.position.set(o.x,o.y,o.z),T.lookAt(o.x,o.y,o.z+G[I]));const A=this._cubeSize;cn(a,m*A,I>2?A:0,A,A),R.setRenderTarget(a),c&&R.render(B,T),R.render(n,T)}R.toneMapping=S,R.autoClear=h,n.background=y}_textureToCubeUV(n,t){const i=this._renderer,a=n.mapping===Cn||n.mapping===hn;a?(this._cubemapMaterial===null&&(this._cubemapMaterial=Ua()),this._cubemapMaterial.uniforms.flipEnvMap.value=n.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=La());const o=a?this._cubemapMaterial:this._equirectMaterial,s=this._lodMeshes[0];s.material=o;const d=o.uniforms;d.envMap.value=n;const T=this._cubeSize;cn(t,0,0,3*T,2*T),i.setRenderTarget(t),i.render(s,vn)}_applyPMREM(n){const t=this._renderer,i=t.autoClear;t.autoClear=!1;const a=this._lodMeshes.length;for(let o=1;o<a;o++)this._applyGGXFilter(n,o-1,o);t.autoClear=i}_applyGGXFilter(n,t,i){const a=this._renderer,o=this._pingPongRenderTarget,s=this._ggxMaterial,d=this._lodMeshes[i];d.material=s;const T=s.uniforms,v=i/(this._lodMeshes.length-1),G=t/(this._lodMeshes.length-1),R=Math.sqrt(v*v-G*G),h=0+v*1.25,S=R*h,{_lodMax:C}=this,B=this._sizeLods[i],u=3*B*(i>C-jt?i-C+jt:0),c=4*(this._cubeSize-B);T.envMap.value=n.texture,T.roughness.value=S,T.mipInt.value=C-t,cn(o,u,c,3*B,2*B),a.setRenderTarget(o),a.render(d,vn),T.envMap.value=o.texture,T.roughness.value=0,T.mipInt.value=C-i,cn(n,u,c,3*B,2*B),a.setRenderTarget(n),a.render(d,vn)}_blur(n,t,i,a,o){const s=this._pingPongRenderTarget;this._halfBlur(n,s,t,i,a,"latitudinal",o),this._halfBlur(s,n,i,i,a,"longitudinal",o)}_halfBlur(n,t,i,a,o,s,d){const T=this._renderer,v=this._blurMaterial;s!=="latitudinal"&&s!=="longitudinal"&&je("blur direction must be either latitudinal or longitudinal!");const G=3,R=this._lodMeshes[a];R.material=v;const h=v.uniforms,S=this._sizeLods[i]-1,C=isFinite(o)?Math.PI/(2*S):2*Math.PI/(2*en-1),B=o/C,u=isFinite(o)?1+Math.floor(G*B):en;u>en&&Ve(`sigmaRadians, ${o}, is too large and will clip, as it requested ${u} samples when the maximum is set to ${en}`);const c=[];let y=0;for(let P=0;P<en;++P){const f=P/B,_=Math.exp(-f*f/2);c.push(_),P===0?y+=_:P<u&&(y+=2*_)}for(let P=0;P<c.length;P++)c[P]=c[P]/y;h.envMap.value=n.texture,h.samples.value=u,h.weights.value=c,h.latitudinal.value=s==="latitudinal",d&&(h.poleAxis.value=d);const{_lodMax:I}=this;h.dTheta.value=C,h.mipInt.value=I-i;const m=this._sizeLods[a],A=3*m*(a>I-jt?a-I+jt:0),g=4*(this._cubeSize-m);cn(t,A,g,3*m,2*m),T.setRenderTarget(t),T.render(R,vn)}}function Mf(e){const n=[],t=[],i=[];let a=e;const o=e-jt+1+Ca.length;for(let s=0;s<o;s++){const d=Math.pow(2,a);n.push(d);let T=1/d;s>e-jt?T=Ca[s-e+jt-1]:s===0&&(T=0),t.push(T);const v=1/(d-2),G=-v,R=1+v,h=[G,G,R,G,R,R,G,G,R,R,G,R],S=6,C=6,B=3,u=2,c=1,y=new Float32Array(B*C*S),I=new Float32Array(u*C*S),m=new Float32Array(c*C*S);for(let g=0;g<S;g++){const P=g%3*2/3-1,f=g>2?0:-1,_=[P,f,0,P+2/3,f,0,P+2/3,f+1,0,P,f,0,P+2/3,f+1,0,P,f+1,0];y.set(_,B*C*g),I.set(h,u*C*g);const N=[g,g,g,g,g,g];m.set(N,c*C*g)}const A=new Pn;A.setAttribute("position",new On(y,B)),A.setAttribute("uv",new On(I,u)),A.setAttribute("faceIndex",new On(m,c)),i.push(new Wt(A,null)),a>jt&&a--}return{lodMeshes:i,sizeLods:n,sigmas:t}}function wa(e,n,t){const i=new wt(e,n,t);return i.texture.mapping=Xn,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function cn(e,n,t,i,a){e.viewport.set(n,t,i,a),e.scissor.set(n,t,i,a)}function Tf(e,n,t){return new kt({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:Ef,CUBEUV_TEXEL_WIDTH:1/n,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:qn(),fragmentShader:`

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
		`,blending:zt,depthTest:!1,depthWrite:!1})}function Af(e,n,t){const i=new Float32Array(en),a=new ye(0,1,0);return new kt({name:"SphericalGaussianBlur",defines:{n:en,CUBEUV_TEXEL_WIDTH:1/n,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:a}},vertexShader:qn(),fragmentShader:`

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
		`,blending:zt,depthTest:!1,depthWrite:!1})}function La(){return new kt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:qn(),fragmentShader:`

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
		`,blending:zt,depthTest:!1,depthWrite:!1})}function Ua(){return new kt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:qn(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:zt,depthTest:!1,depthWrite:!1})}function qn(){return`

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
	`}class Hr extends wt{constructor(n=1,t={}){super(n,n,t),this.isWebGLCubeRenderTarget=!0;const i={width:n,height:n,depth:1},a=[i,i,i,i,i,i];this.texture=new Dr(a),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(n,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},a=new wi(5,5,5),o=new kt({name:"CubemapFromEquirect",uniforms:xi(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:bt,blending:zt});o.uniforms.tEquirect.value=t;const s=new Wt(a,o),d=t.minFilter;return t.minFilter===fn&&(t.minFilter=gt),new ds(1,10,this).update(n,s),t.minFilter=d,s.geometry.dispose(),s.material.dispose(),this}clear(n,t=!0,i=!0,a=!0){const o=n.getRenderTarget();for(let s=0;s<6;s++)n.setRenderTarget(this,s),n.clear(t,i,a);n.setRenderTarget(o)}}function bf(e){let n=new WeakMap,t=new WeakMap,i=null;function a(h,S=!1){return h==null?null:S?s(h):o(h)}function o(h){if(h&&h.isTexture){const S=h.mapping;if(S===ni||S===ii)if(n.has(h)){const C=n.get(h).texture;return d(C,h.mapping)}else{const C=h.image;if(C&&C.height>0){const B=new Hr(C.height);return B.fromEquirectangularTexture(e,h),n.set(h,B),h.addEventListener("dispose",v),d(B.texture,h.mapping)}else return null}}return h}function s(h){if(h&&h.isTexture){const S=h.mapping,C=S===ni||S===ii,B=S===Cn||S===hn;if(C||B){let u=t.get(h);const c=u!==void 0?u.texture.pmremVersion:0;if(h.isRenderTargetTexture&&h.pmremVersion!==c)return i===null&&(i=new Pa(e)),u=C?i.fromEquirectangular(h,u):i.fromCubemap(h,u),u.texture.pmremVersion=h.pmremVersion,t.set(h,u),u.texture;if(u!==void 0)return u.texture;{const y=h.image;return C&&y&&y.height>0||B&&y&&T(y)?(i===null&&(i=new Pa(e)),u=C?i.fromEquirectangular(h):i.fromCubemap(h),u.texture.pmremVersion=h.pmremVersion,t.set(h,u),h.addEventListener("dispose",G),u.texture):null}}}return h}function d(h,S){return S===ni?h.mapping=Cn:S===ii&&(h.mapping=hn),h}function T(h){let S=0;const C=6;for(let B=0;B<C;B++)h[B]!==void 0&&S++;return S===C}function v(h){const S=h.target;S.removeEventListener("dispose",v);const C=n.get(S);C!==void 0&&(n.delete(S),C.dispose())}function G(h){const S=h.target;S.removeEventListener("dispose",G);const C=t.get(S);C!==void 0&&(t.delete(S),C.dispose())}function R(){n=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:a,dispose:R}}function Rf(e){const n={};function t(i){if(n[i]!==void 0)return n[i];const a=e.getExtension(i);return n[i]=a,a}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){const a=t(i);return a===null&&mo("WebGLRenderer: "+i+" extension not supported."),a}}}function Cf(e,n,t,i){const a={},o=new WeakMap;function s(R){const h=R.target;h.index!==null&&n.remove(h.index);for(const C in h.attributes)n.remove(h.attributes[C]);h.removeEventListener("dispose",s),delete a[h.id];const S=o.get(h);S&&(n.remove(S),o.delete(h)),i.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,t.memory.geometries--}function d(R,h){return a[h.id]===!0||(h.addEventListener("dispose",s),a[h.id]=!0,t.memory.geometries++),h}function T(R){const h=R.attributes;for(const S in h)n.update(h[S],e.ARRAY_BUFFER)}function v(R){const h=[],S=R.index,C=R.attributes.position;let B=0;if(C===void 0)return;if(S!==null){const y=S.array;B=S.version;for(let I=0,m=y.length;I<m;I+=3){const A=y[I+0],g=y[I+1],P=y[I+2];h.push(A,g,g,P,P,A)}}else{const y=C.array;B=C.version;for(let I=0,m=y.length/3-1;I<m;I+=3){const A=I+0,g=I+1,P=I+2;h.push(A,g,g,P,P,A)}}const u=new(C.count>=65535?ps:hs)(h,1);u.version=B;const c=o.get(R);c&&n.remove(c),o.set(R,u)}function G(R){const h=o.get(R);if(h){const S=R.index;S!==null&&h.version<S.version&&v(R)}else v(R);return o.get(R)}return{get:d,update:T,getWireframeAttribute:G}}function Df(e,n,t){let i;function a(R){i=R}let o,s;function d(R){o=R.type,s=R.bytesPerElement}function T(R,h){e.drawElements(i,h,o,R*s),t.update(h,i,1)}function v(R,h,S){S!==0&&(e.drawElementsInstanced(i,h,o,R*s,S),t.update(h,i,S))}function G(R,h,S){if(S===0)return;n.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,h,0,o,R,0,S);let B=0;for(let u=0;u<S;u++)B+=h[u];t.update(B,i,1)}this.setMode=a,this.setIndex=d,this.render=T,this.renderInstances=v,this.renderMultiDraw=G}function Pf(e){const n={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(o,s,d){switch(t.calls++,s){case e.TRIANGLES:t.triangles+=d*(o/3);break;case e.LINES:t.lines+=d*(o/2);break;case e.LINE_STRIP:t.lines+=d*(o-1);break;case e.LINE_LOOP:t.lines+=d*o;break;case e.POINTS:t.points+=d*o;break;default:je("WebGLInfo: Unknown draw mode:",s);break}}function a(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:n,render:t,programs:null,autoReset:!0,reset:a,update:i}}function wf(e,n,t){const i=new WeakMap,a=new ht;function o(s,d,T){const v=s.morphTargetInfluences,G=d.morphAttributes.position||d.morphAttributes.normal||d.morphAttributes.color,R=G!==void 0?G.length:0;let h=i.get(d);if(h===void 0||h.count!==R){let _=function(){P.dispose(),i.delete(d),d.removeEventListener("dispose",_)};h!==void 0&&h.texture.dispose();const S=d.morphAttributes.position!==void 0,C=d.morphAttributes.normal!==void 0,B=d.morphAttributes.color!==void 0,u=d.morphAttributes.position||[],c=d.morphAttributes.normal||[],y=d.morphAttributes.color||[];let I=0;S===!0&&(I=1),C===!0&&(I=2),B===!0&&(I=3);let m=d.attributes.position.count*I,A=1;m>n.maxTextureSize&&(A=Math.ceil(m/n.maxTextureSize),m=n.maxTextureSize);const g=new Float32Array(m*A*4*R),P=new Rr(g,m,A,R);P.type=Zt,P.needsUpdate=!0;const f=I*4;for(let N=0;N<R;N++){const D=u[N],O=c[N],j=y[N],K=m*A*4*N;for(let k=0;k<D.count;k++){const q=k*f;S===!0&&(a.fromBufferAttribute(D,k),g[K+q+0]=a.x,g[K+q+1]=a.y,g[K+q+2]=a.z,g[K+q+3]=0),C===!0&&(a.fromBufferAttribute(O,k),g[K+q+4]=a.x,g[K+q+5]=a.y,g[K+q+6]=a.z,g[K+q+7]=0),B===!0&&(a.fromBufferAttribute(j,k),g[K+q+8]=a.x,g[K+q+9]=a.y,g[K+q+10]=a.z,g[K+q+11]=j.itemSize===4?a.w:1)}}h={count:R,texture:P,size:new it(m,A)},i.set(d,h),d.addEventListener("dispose",_)}if(s.isInstancedMesh===!0&&s.morphTexture!==null)T.getUniforms().setValue(e,"morphTexture",s.morphTexture,t);else{let S=0;for(let B=0;B<v.length;B++)S+=v[B];const C=d.morphTargetsRelative?1:1-S;T.getUniforms().setValue(e,"morphTargetBaseInfluence",C),T.getUniforms().setValue(e,"morphTargetInfluences",v)}T.getUniforms().setValue(e,"morphTargetsTexture",h.texture,t),T.getUniforms().setValue(e,"morphTargetsTextureSize",h.size)}return{update:o}}function Lf(e,n,t,i,a){let o=new WeakMap;function s(v){const G=a.render.frame,R=v.geometry,h=n.get(v,R);if(o.get(h)!==G&&(n.update(h),o.set(h,G)),v.isInstancedMesh&&(v.hasEventListener("dispose",T)===!1&&v.addEventListener("dispose",T),o.get(v)!==G&&(t.update(v.instanceMatrix,e.ARRAY_BUFFER),v.instanceColor!==null&&t.update(v.instanceColor,e.ARRAY_BUFFER),o.set(v,G))),v.isSkinnedMesh){const S=v.skeleton;o.get(S)!==G&&(S.update(),o.set(S,G))}return h}function d(){o=new WeakMap}function T(v){const G=v.target;G.removeEventListener("dispose",T),i.releaseStatesOfObject(G),t.remove(G.instanceMatrix),G.instanceColor!==null&&t.remove(G.instanceColor)}return{update:s,dispose:d}}const Uf={[Nr]:"LINEAR_TONE_MAPPING",[Ir]:"REINHARD_TONE_MAPPING",[yr]:"CINEON_TONE_MAPPING",[Ur]:"ACES_FILMIC_TONE_MAPPING",[Lr]:"AGX_TONE_MAPPING",[wr]:"NEUTRAL_TONE_MAPPING",[Pr]:"CUSTOM_TONE_MAPPING"};function yf(e,n,t,i,a,o){const s=new wt(n,t,{type:e,depthBuffer:a,stencilBuffer:o,samples:i?4:0,depthTexture:a?new An(n,t):void 0}),d=new wt(n,t,{type:Vt,depthBuffer:!1,stencilBuffer:!1}),T=new Pn;T.setAttribute("position",new Jt([-1,3,0,-1,-1,0,3,-1,0],3)),T.setAttribute("uv",new Jt([0,2,0,0,2,0],2));const v=new fo({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),G=new Wt(T,v),R=new Ri(-1,1,1,-1,0,1);let h=null,S=null,C=!1,B,u=null,c=[],y=!1;this.setSize=function(I,m){s.setSize(I,m),d.setSize(I,m);for(let A=0;A<c.length;A++){const g=c[A];g.setSize&&g.setSize(I,m)}},this.setEffects=function(I){c=I,y=c.length>0&&c[0].isRenderPass===!0;const m=s.width,A=s.height;for(let g=0;g<c.length;g++){const P=c[g];P.setSize&&P.setSize(m,A)}},this.begin=function(I,m){if(C||I.toneMapping===Ht&&c.length===0)return!1;if(u=m,m!==null){const A=m.width,g=m.height;(s.width!==A||s.height!==g)&&this.setSize(A,g)}return y===!1&&I.setRenderTarget(s),B=I.toneMapping,I.toneMapping=Ht,!0},this.hasRenderPass=function(){return y},this.end=function(I,m){I.toneMapping=B,C=!0;let A=s,g=d;for(let P=0;P<c.length;P++){const f=c[P];if(f.enabled!==!1&&(f.render(I,g,A,m),f.needsSwap!==!1)){const _=A;A=g,g=_}}if(h!==I.outputColorSpace||S!==I.toneMapping){h=I.outputColorSpace,S=I.toneMapping,v.defines={},Je.getTransfer(h)===Ze&&(v.defines.SRGB_TRANSFER="");const P=Uf[S];P&&(v.defines[P]=""),v.needsUpdate=!0}v.uniforms.tDiffuse.value=A.texture,I.setRenderTarget(u),I.render(G,R),u=null,C=!1},this.isCompositing=function(){return C},this.dispose=function(){s.depthTexture&&s.depthTexture.dispose(),s.dispose(),d.dispose(),T.dispose(),v.dispose()}}const Vr=new xs,Mi=new An(1,1),Wr=new Rr,kr=new _s,zr=new Dr,ya=[],Ia=[],Na=new Float32Array(16),Fa=new Float32Array(9),Ga=new Float32Array(4);function _n(e,n,t){const i=e[0];if(i<=0||i>0)return e;const a=n*t;let o=ya[a];if(o===void 0&&(o=new Float32Array(a),ya[a]=o),n!==0){i.toArray(o,0);for(let s=1,d=0;s!==n;++s)d+=t,e[s].toArray(o,d)}return o}function ft(e,n){if(e.length!==n.length)return!1;for(let t=0,i=e.length;t<i;t++)if(e[t]!==n[t])return!1;return!0}function ut(e,n){for(let t=0,i=n.length;t<i;t++)e[t]=n[t]}function Yn(e,n){let t=Ia[n];t===void 0&&(t=new Int32Array(n),Ia[n]=t);for(let i=0;i!==n;++i)t[i]=e.allocateTextureUnit();return t}function If(e,n){const t=this.cache;t[0]!==n&&(e.uniform1f(this.addr,n),t[0]=n)}function Nf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y)&&(e.uniform2f(this.addr,n.x,n.y),t[0]=n.x,t[1]=n.y);else{if(ft(t,n))return;e.uniform2fv(this.addr,n),ut(t,n)}}function Ff(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z)&&(e.uniform3f(this.addr,n.x,n.y,n.z),t[0]=n.x,t[1]=n.y,t[2]=n.z);else if(n.r!==void 0)(t[0]!==n.r||t[1]!==n.g||t[2]!==n.b)&&(e.uniform3f(this.addr,n.r,n.g,n.b),t[0]=n.r,t[1]=n.g,t[2]=n.b);else{if(ft(t,n))return;e.uniform3fv(this.addr,n),ut(t,n)}}function Gf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z||t[3]!==n.w)&&(e.uniform4f(this.addr,n.x,n.y,n.z,n.w),t[0]=n.x,t[1]=n.y,t[2]=n.z,t[3]=n.w);else{if(ft(t,n))return;e.uniform4fv(this.addr,n),ut(t,n)}}function Of(e,n){const t=this.cache,i=n.elements;if(i===void 0){if(ft(t,n))return;e.uniformMatrix2fv(this.addr,!1,n),ut(t,n)}else{if(ft(t,i))return;Ga.set(i),e.uniformMatrix2fv(this.addr,!1,Ga),ut(t,i)}}function Bf(e,n){const t=this.cache,i=n.elements;if(i===void 0){if(ft(t,n))return;e.uniformMatrix3fv(this.addr,!1,n),ut(t,n)}else{if(ft(t,i))return;Fa.set(i),e.uniformMatrix3fv(this.addr,!1,Fa),ut(t,i)}}function Hf(e,n){const t=this.cache,i=n.elements;if(i===void 0){if(ft(t,n))return;e.uniformMatrix4fv(this.addr,!1,n),ut(t,n)}else{if(ft(t,i))return;Na.set(i),e.uniformMatrix4fv(this.addr,!1,Na),ut(t,i)}}function Vf(e,n){const t=this.cache;t[0]!==n&&(e.uniform1i(this.addr,n),t[0]=n)}function Wf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y)&&(e.uniform2i(this.addr,n.x,n.y),t[0]=n.x,t[1]=n.y);else{if(ft(t,n))return;e.uniform2iv(this.addr,n),ut(t,n)}}function kf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z)&&(e.uniform3i(this.addr,n.x,n.y,n.z),t[0]=n.x,t[1]=n.y,t[2]=n.z);else{if(ft(t,n))return;e.uniform3iv(this.addr,n),ut(t,n)}}function zf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z||t[3]!==n.w)&&(e.uniform4i(this.addr,n.x,n.y,n.z,n.w),t[0]=n.x,t[1]=n.y,t[2]=n.z,t[3]=n.w);else{if(ft(t,n))return;e.uniform4iv(this.addr,n),ut(t,n)}}function Xf(e,n){const t=this.cache;t[0]!==n&&(e.uniform1ui(this.addr,n),t[0]=n)}function qf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y)&&(e.uniform2ui(this.addr,n.x,n.y),t[0]=n.x,t[1]=n.y);else{if(ft(t,n))return;e.uniform2uiv(this.addr,n),ut(t,n)}}function Yf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z)&&(e.uniform3ui(this.addr,n.x,n.y,n.z),t[0]=n.x,t[1]=n.y,t[2]=n.z);else{if(ft(t,n))return;e.uniform3uiv(this.addr,n),ut(t,n)}}function Kf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z||t[3]!==n.w)&&(e.uniform4ui(this.addr,n.x,n.y,n.z,n.w),t[0]=n.x,t[1]=n.y,t[2]=n.z,t[3]=n.w);else{if(ft(t,n))return;e.uniform4uiv(this.addr,n),ut(t,n)}}function $f(e,n,t){const i=this.cache,a=t.allocateTextureUnit();i[0]!==a&&(e.uniform1i(this.addr,a),i[0]=a);let o;this.type===e.SAMPLER_2D_SHADOW?(Mi.compareFunction=t.isReversedDepthBuffer()?Ci:Di,o=Mi):o=Vr,t.setTexture2D(n||o,a)}function Zf(e,n,t){const i=this.cache,a=t.allocateTextureUnit();i[0]!==a&&(e.uniform1i(this.addr,a),i[0]=a),t.setTexture3D(n||kr,a)}function jf(e,n,t){const i=this.cache,a=t.allocateTextureUnit();i[0]!==a&&(e.uniform1i(this.addr,a),i[0]=a),t.setTextureCube(n||zr,a)}function Qf(e,n,t){const i=this.cache,a=t.allocateTextureUnit();i[0]!==a&&(e.uniform1i(this.addr,a),i[0]=a),t.setTexture2DArray(n||Wr,a)}function Jf(e){switch(e){case 5126:return If;case 35664:return Nf;case 35665:return Ff;case 35666:return Gf;case 35674:return Of;case 35675:return Bf;case 35676:return Hf;case 5124:case 35670:return Vf;case 35667:case 35671:return Wf;case 35668:case 35672:return kf;case 35669:case 35673:return zf;case 5125:return Xf;case 36294:return qf;case 36295:return Yf;case 36296:return Kf;case 35678:case 36198:case 36298:case 36306:case 35682:return $f;case 35679:case 36299:case 36307:return Zf;case 35680:case 36300:case 36308:case 36293:return jf;case 36289:case 36303:case 36311:case 36292:return Qf}}function eu(e,n){e.uniform1fv(this.addr,n)}function tu(e,n){const t=_n(n,this.size,2);e.uniform2fv(this.addr,t)}function nu(e,n){const t=_n(n,this.size,3);e.uniform3fv(this.addr,t)}function iu(e,n){const t=_n(n,this.size,4);e.uniform4fv(this.addr,t)}function au(e,n){const t=_n(n,this.size,4);e.uniformMatrix2fv(this.addr,!1,t)}function ru(e,n){const t=_n(n,this.size,9);e.uniformMatrix3fv(this.addr,!1,t)}function ou(e,n){const t=_n(n,this.size,16);e.uniformMatrix4fv(this.addr,!1,t)}function su(e,n){e.uniform1iv(this.addr,n)}function lu(e,n){e.uniform2iv(this.addr,n)}function cu(e,n){e.uniform3iv(this.addr,n)}function fu(e,n){e.uniform4iv(this.addr,n)}function uu(e,n){e.uniform1uiv(this.addr,n)}function du(e,n){e.uniform2uiv(this.addr,n)}function pu(e,n){e.uniform3uiv(this.addr,n)}function hu(e,n){e.uniform4uiv(this.addr,n)}function mu(e,n,t){const i=this.cache,a=n.length,o=Yn(t,a);ft(i,o)||(e.uniform1iv(this.addr,o),ut(i,o));let s;this.type===e.SAMPLER_2D_SHADOW?s=Mi:s=Vr;for(let d=0;d!==a;++d)t.setTexture2D(n[d]||s,o[d])}function _u(e,n,t){const i=this.cache,a=n.length,o=Yn(t,a);ft(i,o)||(e.uniform1iv(this.addr,o),ut(i,o));for(let s=0;s!==a;++s)t.setTexture3D(n[s]||kr,o[s])}function gu(e,n,t){const i=this.cache,a=n.length,o=Yn(t,a);ft(i,o)||(e.uniform1iv(this.addr,o),ut(i,o));for(let s=0;s!==a;++s)t.setTextureCube(n[s]||zr,o[s])}function vu(e,n,t){const i=this.cache,a=n.length,o=Yn(t,a);ft(i,o)||(e.uniform1iv(this.addr,o),ut(i,o));for(let s=0;s!==a;++s)t.setTexture2DArray(n[s]||Wr,o[s])}function Su(e){switch(e){case 5126:return eu;case 35664:return tu;case 35665:return nu;case 35666:return iu;case 35674:return au;case 35675:return ru;case 35676:return ou;case 5124:case 35670:return su;case 35667:case 35671:return lu;case 35668:case 35672:return cu;case 35669:case 35673:return fu;case 5125:return uu;case 36294:return du;case 36295:return pu;case 36296:return hu;case 35678:case 36198:case 36298:case 36306:case 35682:return mu;case 35679:case 36299:case 36307:return _u;case 35680:case 36300:case 36308:case 36293:return gu;case 36289:case 36303:case 36311:case 36292:return vu}}class Eu{constructor(n,t,i){this.id=n,this.addr=i,this.cache=[],this.type=t.type,this.setValue=Jf(t.type)}}class xu{constructor(n,t,i){this.id=n,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Su(t.type)}}class Mu{constructor(n){this.id=n,this.seq=[],this.map={}}setValue(n,t,i){const a=this.seq;for(let o=0,s=a.length;o!==s;++o){const d=a[o];d.setValue(n,t[d.id],i)}}}const ci=/(\w+)(\])?(\[|\.)?/g;function Oa(e,n){e.seq.push(n),e.map[n.id]=n}function Tu(e,n,t){const i=e.name,a=i.length;for(ci.lastIndex=0;;){const o=ci.exec(i),s=ci.lastIndex;let d=o[1];const T=o[2]==="]",v=o[3];if(T&&(d=d|0),v===void 0||v==="["&&s+2===a){Oa(t,v===void 0?new Eu(d,e,n):new xu(d,e,n));break}else{let R=t.map[d];R===void 0&&(R=new Mu(d),Oa(t,R)),t=R}}}class Vn{constructor(n,t){this.seq=[],this.map={};const i=n.getProgramParameter(t,n.ACTIVE_UNIFORMS);for(let s=0;s<i;++s){const d=n.getActiveUniform(t,s),T=n.getUniformLocation(t,d.name);Tu(d,T,this)}const a=[],o=[];for(const s of this.seq)s.type===n.SAMPLER_2D_SHADOW||s.type===n.SAMPLER_CUBE_SHADOW||s.type===n.SAMPLER_2D_ARRAY_SHADOW?a.push(s):o.push(s);a.length>0&&(this.seq=a.concat(o))}setValue(n,t,i,a){const o=this.map[t];o!==void 0&&o.setValue(n,i,a)}setOptional(n,t,i){const a=t[i];a!==void 0&&this.setValue(n,i,a)}static upload(n,t,i,a){for(let o=0,s=t.length;o!==s;++o){const d=t[o],T=i[d.id];T.needsUpdate!==!1&&d.setValue(n,T.value,a)}}static seqWithValue(n,t){const i=[];for(let a=0,o=n.length;a!==o;++a){const s=n[a];s.id in t&&i.push(s)}return i}}function Ba(e,n,t){const i=e.createShader(n);return e.shaderSource(i,t),e.compileShader(i),i}const Au=37297;let bu=0;function Ru(e,n){const t=e.split(`
`),i=[],a=Math.max(n-6,0),o=Math.min(n+6,t.length);for(let s=a;s<o;s++){const d=s+1;i.push(`${d===n?">":" "} ${d}: ${t[s]}`)}return i.join(`
`)}const Ha=new Ne;function Cu(e){Je._getMatrix(Ha,Je.workingColorSpace,e);const n=`mat3( ${Ha.elements.map(t=>t.toFixed(4))} )`;switch(Je.getTransfer(e)){case Gr:return[n,"LinearTransferOETF"];case Ze:return[n,"sRGBTransferOETF"];default:return Ve("WebGLProgram: Unsupported color space: ",e),[n,"LinearTransferOETF"]}}function Va(e,n,t){const i=e.getShaderParameter(n,e.COMPILE_STATUS),o=(e.getShaderInfoLog(n)||"").trim();if(i&&o==="")return"";const s=/ERROR: 0:(\d+)/.exec(o);if(s){const d=parseInt(s[1]);return t.toUpperCase()+`

`+o+`

`+Ru(e.getShaderSource(n),d)}else return o}function Du(e,n){const t=Cu(n);return[`vec4 ${e}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}const Pu={[Nr]:"Linear",[Ir]:"Reinhard",[yr]:"Cineon",[Ur]:"ACESFilmic",[Lr]:"AgX",[wr]:"Neutral",[Pr]:"Custom"};function wu(e,n){const t=Pu[n];return t===void 0?(Ve("WebGLProgram: Unsupported toneMapping:",n),"vec3 "+e+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+e+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const In=new ye;function Lu(){Je.getLuminanceCoefficients(In);const e=In.x.toFixed(4),n=In.y.toFixed(4),t=In.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${e}, ${n}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Uu(e){return[e.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",e.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(xn).join(`
`)}function yu(e){const n=[];for(const t in e){const i=e[t];i!==!1&&n.push("#define "+t+" "+i)}return n.join(`
`)}function Iu(e,n){const t={},i=e.getProgramParameter(n,e.ACTIVE_ATTRIBUTES);for(let a=0;a<i;a++){const o=e.getActiveAttrib(n,a),s=o.name;let d=1;o.type===e.FLOAT_MAT2&&(d=2),o.type===e.FLOAT_MAT3&&(d=3),o.type===e.FLOAT_MAT4&&(d=4),t[s]={type:o.type,location:e.getAttribLocation(n,s),locationSize:d}}return t}function xn(e){return e!==""}function Wa(e,n){const t=n.numSpotLightShadows+n.numSpotLightMaps-n.numSpotLightShadowsWithMaps;return e.replace(/NUM_DIR_LIGHTS/g,n.numDirLights).replace(/NUM_SPOT_LIGHTS/g,n.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,n.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,n.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,n.numPointLights).replace(/NUM_HEMI_LIGHTS/g,n.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,n.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,n.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,n.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,n.numPointLightShadows)}function ka(e,n){return e.replace(/NUM_CLIPPING_PLANES/g,n.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,n.numClippingPlanes-n.numClipIntersection)}const Nu=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ti(e){return e.replace(Nu,Gu)}const Fu=new Map;function Gu(e,n){let t=we[n];if(t===void 0){const i=Fu.get(n);if(i!==void 0)t=we[i],Ve('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',n,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+n+">")}return Ti(t)}const Ou=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function za(e){return e.replace(Ou,Bu)}function Bu(e,n,t,i){let a="";for(let o=parseInt(n);o<parseInt(t);o++)a+=i.replace(/\[\s*i\s*\]/g,"[ "+o+" ]").replace(/UNROLLED_LOOP_INDEX/g,o);return a}function Xa(e){let n=`precision ${e.precision} float;
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
#define LOW_PRECISION`),n}const Hu={[Bn]:"SHADOWMAP_TYPE_PCF",[En]:"SHADOWMAP_TYPE_VSM"};function Vu(e){return Hu[e.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const Wu={[Cn]:"ENVMAP_TYPE_CUBE",[hn]:"ENVMAP_TYPE_CUBE",[Xn]:"ENVMAP_TYPE_CUBE_UV"};function ku(e){return e.envMap===!1?"ENVMAP_TYPE_CUBE":Wu[e.envMapMode]||"ENVMAP_TYPE_CUBE"}const zu={[hn]:"ENVMAP_MODE_REFRACTION"};function Xu(e){return e.envMap===!1?"ENVMAP_MODE_REFLECTION":zu[e.envMapMode]||"ENVMAP_MODE_REFLECTION"}const qu={[Es]:"ENVMAP_BLENDING_MULTIPLY",[Ss]:"ENVMAP_BLENDING_MIX",[vs]:"ENVMAP_BLENDING_ADD"};function Yu(e){return e.envMap===!1?"ENVMAP_BLENDING_NONE":qu[e.combine]||"ENVMAP_BLENDING_NONE"}function Ku(e){const n=e.envMapCubeUVHeight;if(n===null)return null;const t=Math.log2(n)-2,i=1/n;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function $u(e,n,t,i){const a=e.getContext(),o=t.defines;let s=t.vertexShader,d=t.fragmentShader;const T=Vu(t),v=ku(t),G=Xu(t),R=Yu(t),h=Ku(t),S=Uu(t),C=yu(o),B=a.createProgram();let u,c,y=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(u=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,C].filter(xn).join(`
`),u.length>0&&(u+=`
`),c=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,C].filter(xn).join(`
`),c.length>0&&(c+=`
`)):(u=[Xa(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,C,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+G:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+T:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(xn).join(`
`),c=[Xa(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,C,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+v:"",t.envMap?"#define "+G:"",t.envMap?"#define "+R:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+T:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Ht?"#define TONE_MAPPING":"",t.toneMapping!==Ht?we.tonemapping_pars_fragment:"",t.toneMapping!==Ht?wu("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",we.colorspace_pars_fragment,Du("linearToOutputTexel",t.outputColorSpace),Lu(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(xn).join(`
`)),s=Ti(s),s=Wa(s,t),s=ka(s,t),d=Ti(d),d=Wa(d,t),d=ka(d,t),s=za(s),d=za(d),t.isRawShaderMaterial!==!0&&(y=`#version 300 es
`,u=[S,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+u,c=["#define varying in",t.glslVersion===Ra?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Ra?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+c);const I=y+u+s,m=y+c+d,A=Ba(a,a.VERTEX_SHADER,I),g=Ba(a,a.FRAGMENT_SHADER,m);a.attachShader(B,A),a.attachShader(B,g),t.index0AttributeName!==void 0?a.bindAttribLocation(B,0,t.index0AttributeName):t.hasPositionAttribute===!0&&a.bindAttribLocation(B,0,"position"),a.linkProgram(B);function P(D){if(e.debug.checkShaderErrors){const O=a.getProgramInfoLog(B)||"",j=a.getShaderInfoLog(A)||"",K=a.getShaderInfoLog(g)||"",k=O.trim(),q=j.trim(),V=K.trim();let Z=!0,ee=!0;if(a.getProgramParameter(B,a.LINK_STATUS)===!1)if(Z=!1,typeof e.debug.onShaderError=="function")e.debug.onShaderError(a,B,A,g);else{const ce=Va(a,A,"vertex"),_e=Va(a,g,"fragment");je("WebGLProgram: Shader Error "+a.getError()+" - VALIDATE_STATUS "+a.getProgramParameter(B,a.VALIDATE_STATUS)+`

Material Name: `+D.name+`
Material Type: `+D.type+`

Program Info Log: `+k+`
`+ce+`
`+_e)}else k!==""?Ve("WebGLProgram: Program Info Log:",k):(q===""||V==="")&&(ee=!1);ee&&(D.diagnostics={runnable:Z,programLog:k,vertexShader:{log:q,prefix:u},fragmentShader:{log:V,prefix:c}})}a.deleteShader(A),a.deleteShader(g),f=new Vn(a,B),_=Iu(a,B)}let f;this.getUniforms=function(){return f===void 0&&P(this),f};let _;this.getAttributes=function(){return _===void 0&&P(this),_};let N=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return N===!1&&(N=a.getProgramParameter(B,Au)),N},this.destroy=function(){i.releaseStatesOfProgram(this),a.deleteProgram(B),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=bu++,this.cacheKey=n,this.usedTimes=1,this.program=B,this.vertexShader=A,this.fragmentShader=g,this}let Zu=0;class ju{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(n,t,i){const a=this._getShaderCacheForMaterial(n);return a.has(t)===!1&&(a.add(t),t.usedTimes++),a.has(i)===!1&&(a.add(i),i.usedTimes++),this}remove(n){const t=this.materialCache.get(n);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(n),this}getVertexShaderStage(n){return this._getShaderStage(n.vertexShader)}getFragmentShaderStage(n){return this._getShaderStage(n.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(n){const t=this.materialCache;let i=t.get(n);return i===void 0&&(i=new Set,t.set(n,i)),i}_getShaderStage(n){const t=this.shaderCache;let i=t.get(n);return i===void 0&&(i=new Qu(n),t.set(n,i)),i}}class Qu{constructor(n){this.id=Zu++,this.code=n,this.usedTimes=0}}function Ju(e){return e===on||e===Si||e===Ei}function ed(e,n,t,i,a,o){const s=new ms,d=new ju,T=new Set,v=[],G=new Map,R=i.logarithmicDepthBuffer;let h=i.precision;const S={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function C(f){return T.add(f),f===0?"uv":`uv${f}`}function B(f,_,N,D,O,j){const K=D.fog,k=O.geometry,q=f.isMeshStandardMaterial||f.isMeshLambertMaterial||f.isMeshPhongMaterial?D.environment:null,V=f.isMeshStandardMaterial||f.isMeshLambertMaterial&&!f.envMap||f.isMeshPhongMaterial&&!f.envMap,Z=n.get(f.envMap||q,V),ee=Z&&Z.mapping===Xn?Z.image.height:null,ce=S[f.type];f.precision!==null&&(h=i.getMaxPrecision(f.precision),h!==f.precision&&Ve("WebGLProgram.getParameters:",f.precision,"not supported, using",h,"instead."));const _e=k.morphAttributes.position||k.morphAttributes.normal||k.morphAttributes.color,ve=_e!==void 0?_e.length:0;let Oe=0;k.morphAttributes.position!==void 0&&(Oe=1),k.morphAttributes.normal!==void 0&&(Oe=2),k.morphAttributes.color!==void 0&&(Oe=3);let Qe,Be,z,ne;if(ce){const me=Gt[ce];Qe=me.vertexShader,Be=me.fragmentShader}else{Qe=f.vertexShader,Be=f.fragmentShader;const me=d.getVertexShaderStage(f),tt=d.getFragmentShaderStage(f);d.update(f,me,tt),z=me.id,ne=tt.id}const Q=e.getRenderTarget(),Re=e.state.buffers.depth.getReversed(),Ce=O.isInstancedMesh===!0,Ae=O.isBatchedMesh===!0,at=!!f.map,Ie=!!f.matcap,ze=!!Z,He=!!f.aoMap,Fe=!!f.lightMap,st=!!f.bumpMap&&f.wireframe===!1,ct=!!f.normalMap,dt=!!f.displacementMap,mt=!!f.emissiveMap,et=!!f.metalnessMap,lt=!!f.roughnessMap,x=f.anisotropy>0,xt=f.clearcoat>0,We=f.dispersion>0,p=f.iridescence>0,r=f.sheen>0,b=f.transmission>0,U=x&&!!f.anisotropyMap,H=xt&&!!f.clearcoatMap,J=xt&&!!f.clearcoatNormalMap,ie=xt&&!!f.clearcoatRoughnessMap,W=p&&!!f.iridescenceMap,Y=p&&!!f.iridescenceThicknessMap,ae=r&&!!f.sheenColorMap,Ee=r&&!!f.sheenRoughnessMap,se=!!f.specularMap,re=!!f.specularColorMap,Te=!!f.specularIntensityMap,be=b&&!!f.transmissionMap,De=b&&!!f.thicknessMap,E=!!f.gradientMap,te=!!f.alphaMap,X=f.alphaTest>0,oe=!!f.alphaHash,de=!!f.extensions;let $=Ht;f.toneMapped&&(Q===null||Q.isXRRenderTarget===!0)&&($=e.toneMapping);const Se={shaderID:ce,shaderType:f.type,shaderName:f.name,vertexShader:Qe,fragmentShader:Be,defines:f.defines,customVertexShaderID:z,customFragmentShaderID:ne,isRawShaderMaterial:f.isRawShaderMaterial===!0,glslVersion:f.glslVersion,precision:h,batching:Ae,batchingColor:Ae&&O._colorsTexture!==null,instancing:Ce,instancingColor:Ce&&O.instanceColor!==null,instancingMorph:Ce&&O.morphTexture!==null,outputColorSpace:Q===null?e.outputColorSpace:Q.isXRRenderTarget===!0?Q.texture.colorSpace:Je.workingColorSpace,alphaToCoverage:!!f.alphaToCoverage,map:at,matcap:Ie,envMap:ze,envMapMode:ze&&Z.mapping,envMapCubeUVHeight:ee,aoMap:He,lightMap:Fe,bumpMap:st,normalMap:ct,displacementMap:dt,emissiveMap:mt,normalMapObjectSpace:ct&&f.normalMapType===us,normalMapTangentSpace:ct&&f.normalMapType===Aa,packedNormalMap:ct&&f.normalMapType===Aa&&Ju(f.normalMap.format),metalnessMap:et,roughnessMap:lt,anisotropy:x,anisotropyMap:U,clearcoat:xt,clearcoatMap:H,clearcoatNormalMap:J,clearcoatRoughnessMap:ie,dispersion:We,iridescence:p,iridescenceMap:W,iridescenceThicknessMap:Y,sheen:r,sheenColorMap:ae,sheenRoughnessMap:Ee,specularMap:se,specularColorMap:re,specularIntensityMap:Te,transmission:b,transmissionMap:be,thicknessMap:De,gradientMap:E,opaque:f.transparent===!1&&f.blending===Hn&&f.alphaToCoverage===!1,alphaMap:te,alphaTest:X,alphaHash:oe,combine:f.combine,mapUv:at&&C(f.map.channel),aoMapUv:He&&C(f.aoMap.channel),lightMapUv:Fe&&C(f.lightMap.channel),bumpMapUv:st&&C(f.bumpMap.channel),normalMapUv:ct&&C(f.normalMap.channel),displacementMapUv:dt&&C(f.displacementMap.channel),emissiveMapUv:mt&&C(f.emissiveMap.channel),metalnessMapUv:et&&C(f.metalnessMap.channel),roughnessMapUv:lt&&C(f.roughnessMap.channel),anisotropyMapUv:U&&C(f.anisotropyMap.channel),clearcoatMapUv:H&&C(f.clearcoatMap.channel),clearcoatNormalMapUv:J&&C(f.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ie&&C(f.clearcoatRoughnessMap.channel),iridescenceMapUv:W&&C(f.iridescenceMap.channel),iridescenceThicknessMapUv:Y&&C(f.iridescenceThicknessMap.channel),sheenColorMapUv:ae&&C(f.sheenColorMap.channel),sheenRoughnessMapUv:Ee&&C(f.sheenRoughnessMap.channel),specularMapUv:se&&C(f.specularMap.channel),specularColorMapUv:re&&C(f.specularColorMap.channel),specularIntensityMapUv:Te&&C(f.specularIntensityMap.channel),transmissionMapUv:be&&C(f.transmissionMap.channel),thicknessMapUv:De&&C(f.thicknessMap.channel),alphaMapUv:te&&C(f.alphaMap.channel),vertexTangents:!!k.attributes.tangent&&(ct||x),vertexNormals:!!k.attributes.normal,vertexColors:f.vertexColors,vertexAlphas:f.vertexColors===!0&&!!k.attributes.color&&k.attributes.color.itemSize===4,pointsUvs:O.isPoints===!0&&!!k.attributes.uv&&(at||te),fog:!!K,useFog:f.fog===!0,fogExp2:!!K&&K.isFogExp2,flatShading:f.wireframe===!1&&(f.flatShading===!0||k.attributes.normal===void 0&&ct===!1&&(f.isMeshLambertMaterial||f.isMeshPhongMaterial||f.isMeshStandardMaterial||f.isMeshPhysicalMaterial)),sizeAttenuation:f.sizeAttenuation===!0,logarithmicDepthBuffer:R,reversedDepthBuffer:Re,skinning:O.isSkinnedMesh===!0,hasPositionAttribute:k.attributes.position!==void 0,morphTargets:k.morphAttributes.position!==void 0,morphNormals:k.morphAttributes.normal!==void 0,morphColors:k.morphAttributes.color!==void 0,morphTargetsCount:ve,morphTextureStride:Oe,numDirLights:_.directional.length,numPointLights:_.point.length,numSpotLights:_.spot.length,numSpotLightMaps:_.spotLightMap.length,numRectAreaLights:_.rectArea.length,numHemiLights:_.hemi.length,numDirLightShadows:_.directionalShadowMap.length,numPointLightShadows:_.pointShadowMap.length,numSpotLightShadows:_.spotShadowMap.length,numSpotLightShadowsWithMaps:_.numSpotLightShadowsWithMaps,numLightProbes:_.numLightProbes,numLightProbeGrids:j.length,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:f.dithering,shadowMapEnabled:e.shadowMap.enabled&&N.length>0,shadowMapType:e.shadowMap.type,toneMapping:$,decodeVideoTexture:at&&f.map.isVideoTexture===!0&&Je.getTransfer(f.map.colorSpace)===Ze,decodeVideoTextureEmissive:mt&&f.emissiveMap.isVideoTexture===!0&&Je.getTransfer(f.emissiveMap.colorSpace)===Ze,premultipliedAlpha:f.premultipliedAlpha,doubleSided:f.side===Ot,flipSided:f.side===bt,useDepthPacking:f.depthPacking>=0,depthPacking:f.depthPacking||0,index0AttributeName:f.index0AttributeName,extensionClipCullDistance:de&&f.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(de&&f.extensions.multiDraw===!0||Ae)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:f.customProgramCacheKey()};return Se.vertexUv1s=T.has(1),Se.vertexUv2s=T.has(2),Se.vertexUv3s=T.has(3),T.clear(),Se}function u(f){const _=[];if(f.shaderID?_.push(f.shaderID):(_.push(f.customVertexShaderID),_.push(f.customFragmentShaderID)),f.defines!==void 0)for(const N in f.defines)_.push(N),_.push(f.defines[N]);return f.isRawShaderMaterial===!1&&(c(_,f),y(_,f),_.push(e.outputColorSpace)),_.push(f.customProgramCacheKey),_.join()}function c(f,_){f.push(_.precision),f.push(_.outputColorSpace),f.push(_.envMapMode),f.push(_.envMapCubeUVHeight),f.push(_.mapUv),f.push(_.alphaMapUv),f.push(_.lightMapUv),f.push(_.aoMapUv),f.push(_.bumpMapUv),f.push(_.normalMapUv),f.push(_.displacementMapUv),f.push(_.emissiveMapUv),f.push(_.metalnessMapUv),f.push(_.roughnessMapUv),f.push(_.anisotropyMapUv),f.push(_.clearcoatMapUv),f.push(_.clearcoatNormalMapUv),f.push(_.clearcoatRoughnessMapUv),f.push(_.iridescenceMapUv),f.push(_.iridescenceThicknessMapUv),f.push(_.sheenColorMapUv),f.push(_.sheenRoughnessMapUv),f.push(_.specularMapUv),f.push(_.specularColorMapUv),f.push(_.specularIntensityMapUv),f.push(_.transmissionMapUv),f.push(_.thicknessMapUv),f.push(_.combine),f.push(_.fogExp2),f.push(_.sizeAttenuation),f.push(_.morphTargetsCount),f.push(_.morphAttributeCount),f.push(_.numDirLights),f.push(_.numPointLights),f.push(_.numSpotLights),f.push(_.numSpotLightMaps),f.push(_.numHemiLights),f.push(_.numRectAreaLights),f.push(_.numDirLightShadows),f.push(_.numPointLightShadows),f.push(_.numSpotLightShadows),f.push(_.numSpotLightShadowsWithMaps),f.push(_.numLightProbes),f.push(_.shadowMapType),f.push(_.toneMapping),f.push(_.numClippingPlanes),f.push(_.numClipIntersection),f.push(_.depthPacking)}function y(f,_){s.disableAll(),_.instancing&&s.enable(0),_.instancingColor&&s.enable(1),_.instancingMorph&&s.enable(2),_.matcap&&s.enable(3),_.envMap&&s.enable(4),_.normalMapObjectSpace&&s.enable(5),_.normalMapTangentSpace&&s.enable(6),_.clearcoat&&s.enable(7),_.iridescence&&s.enable(8),_.alphaTest&&s.enable(9),_.vertexColors&&s.enable(10),_.vertexAlphas&&s.enable(11),_.vertexUv1s&&s.enable(12),_.vertexUv2s&&s.enable(13),_.vertexUv3s&&s.enable(14),_.vertexTangents&&s.enable(15),_.anisotropy&&s.enable(16),_.alphaHash&&s.enable(17),_.batching&&s.enable(18),_.dispersion&&s.enable(19),_.batchingColor&&s.enable(20),_.gradientMap&&s.enable(21),_.packedNormalMap&&s.enable(22),_.vertexNormals&&s.enable(23),f.push(s.mask),s.disableAll(),_.fog&&s.enable(0),_.useFog&&s.enable(1),_.flatShading&&s.enable(2),_.logarithmicDepthBuffer&&s.enable(3),_.reversedDepthBuffer&&s.enable(4),_.skinning&&s.enable(5),_.morphTargets&&s.enable(6),_.morphNormals&&s.enable(7),_.morphColors&&s.enable(8),_.premultipliedAlpha&&s.enable(9),_.shadowMapEnabled&&s.enable(10),_.doubleSided&&s.enable(11),_.flipSided&&s.enable(12),_.useDepthPacking&&s.enable(13),_.dithering&&s.enable(14),_.transmission&&s.enable(15),_.sheen&&s.enable(16),_.opaque&&s.enable(17),_.pointsUvs&&s.enable(18),_.decodeVideoTexture&&s.enable(19),_.decodeVideoTextureEmissive&&s.enable(20),_.alphaToCoverage&&s.enable(21),_.numLightProbeGrids>0&&s.enable(22),_.hasPositionAttribute&&s.enable(23),f.push(s.mask)}function I(f){const _=S[f.type];let N;if(_){const D=Gt[_];N=fs.clone(D.uniforms)}else N=f.uniforms;return N}function m(f,_){let N=G.get(_);return N!==void 0?++N.usedTimes:(N=new $u(e,_,f,a),v.push(N),G.set(_,N)),N}function A(f){if(--f.usedTimes===0){const _=v.indexOf(f);v[_]=v[v.length-1],v.pop(),G.delete(f.cacheKey),f.destroy()}}function g(f){d.remove(f)}function P(){d.dispose()}return{getParameters:B,getProgramCacheKey:u,getUniforms:I,acquireProgram:m,releaseProgram:A,releaseShaderCache:g,programs:v,dispose:P}}function td(){let e=new WeakMap;function n(s){return e.has(s)}function t(s){let d=e.get(s);return d===void 0&&(d={},e.set(s,d)),d}function i(s){e.delete(s)}function a(s,d,T){e.get(s)[d]=T}function o(){e=new WeakMap}return{has:n,get:t,remove:i,update:a,dispose:o}}function nd(e,n){return e.groupOrder!==n.groupOrder?e.groupOrder-n.groupOrder:e.renderOrder!==n.renderOrder?e.renderOrder-n.renderOrder:e.material.id!==n.material.id?e.material.id-n.material.id:e.materialVariant!==n.materialVariant?e.materialVariant-n.materialVariant:e.z!==n.z?e.z-n.z:e.id-n.id}function qa(e,n){return e.groupOrder!==n.groupOrder?e.groupOrder-n.groupOrder:e.renderOrder!==n.renderOrder?e.renderOrder-n.renderOrder:e.z!==n.z?n.z-e.z:e.id-n.id}function Ya(){const e=[];let n=0;const t=[],i=[],a=[];function o(){n=0,t.length=0,i.length=0,a.length=0}function s(h){let S=0;return h.isInstancedMesh&&(S+=2),h.isSkinnedMesh&&(S+=1),S}function d(h,S,C,B,u,c){let y=e[n];return y===void 0?(y={id:h.id,object:h,geometry:S,material:C,materialVariant:s(h),groupOrder:B,renderOrder:h.renderOrder,z:u,group:c},e[n]=y):(y.id=h.id,y.object=h,y.geometry=S,y.material=C,y.materialVariant=s(h),y.groupOrder=B,y.renderOrder=h.renderOrder,y.z=u,y.group=c),n++,y}function T(h,S,C,B,u,c){const y=d(h,S,C,B,u,c);C.transmission>0?i.push(y):C.transparent===!0?a.push(y):t.push(y)}function v(h,S,C,B,u,c){const y=d(h,S,C,B,u,c);C.transmission>0?i.unshift(y):C.transparent===!0?a.unshift(y):t.unshift(y)}function G(h,S,C){t.length>1&&t.sort(h||nd),i.length>1&&i.sort(S||qa),a.length>1&&a.sort(S||qa),C&&(t.reverse(),i.reverse(),a.reverse())}function R(){for(let h=n,S=e.length;h<S;h++){const C=e[h];if(C.id===null)break;C.id=null,C.object=null,C.geometry=null,C.material=null,C.group=null}}return{opaque:t,transmissive:i,transparent:a,init:o,push:T,unshift:v,finish:R,sort:G}}function id(){let e=new WeakMap;function n(i,a){const o=e.get(i);let s;return o===void 0?(s=new Ya,e.set(i,[s])):a>=o.length?(s=new Ya,o.push(s)):s=o[a],s}function t(){e=new WeakMap}return{get:n,dispose:t}}function ad(){const e={};return{get:function(n){if(e[n.id]!==void 0)return e[n.id];let t;switch(n.type){case"DirectionalLight":t={direction:new ye,color:new Ye};break;case"SpotLight":t={position:new ye,direction:new ye,color:new Ye,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new ye,color:new Ye,distance:0,decay:0};break;case"HemisphereLight":t={direction:new ye,skyColor:new Ye,groundColor:new Ye};break;case"RectAreaLight":t={color:new Ye,position:new ye,halfWidth:new ye,halfHeight:new ye};break}return e[n.id]=t,t}}}function rd(){const e={};return{get:function(n){if(e[n.id]!==void 0)return e[n.id];let t;switch(n.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new it};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new it};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new it,shadowCameraNear:1,shadowCameraFar:1e3};break}return e[n.id]=t,t}}}let od=0;function sd(e,n){return(n.castShadow?2:0)-(e.castShadow?2:0)+(n.map?1:0)-(e.map?1:0)}function ld(e){const n=new ad,t=rd(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let v=0;v<9;v++)i.probe.push(new ye);const a=new ye,o=new an,s=new an;function d(v){let G=0,R=0,h=0;for(let _=0;_<9;_++)i.probe[_].set(0,0,0);let S=0,C=0,B=0,u=0,c=0,y=0,I=0,m=0,A=0,g=0,P=0;v.sort(sd);for(let _=0,N=v.length;_<N;_++){const D=v[_],O=D.color,j=D.intensity,K=D.distance;let k=null;if(D.shadow&&D.shadow.map&&(D.shadow.map.texture.format===on?k=D.shadow.map.texture:k=D.shadow.map.depthTexture||D.shadow.map.texture),D.isAmbientLight)G+=O.r*j,R+=O.g*j,h+=O.b*j;else if(D.isLightProbe){for(let q=0;q<9;q++)i.probe[q].addScaledVector(D.sh.coefficients[q],j);P++}else if(D.isDirectionalLight){const q=n.get(D);if(q.color.copy(D.color).multiplyScalar(D.intensity),D.castShadow){const V=D.shadow,Z=t.get(D);Z.shadowIntensity=V.intensity,Z.shadowBias=V.bias,Z.shadowNormalBias=V.normalBias,Z.shadowRadius=V.radius,Z.shadowMapSize=V.mapSize,i.directionalShadow[S]=Z,i.directionalShadowMap[S]=k,i.directionalShadowMatrix[S]=D.shadow.matrix,y++}i.directional[S]=q,S++}else if(D.isSpotLight){const q=n.get(D);q.position.setFromMatrixPosition(D.matrixWorld),q.color.copy(O).multiplyScalar(j),q.distance=K,q.coneCos=Math.cos(D.angle),q.penumbraCos=Math.cos(D.angle*(1-D.penumbra)),q.decay=D.decay,i.spot[B]=q;const V=D.shadow;if(D.map&&(i.spotLightMap[A]=D.map,A++,V.updateMatrices(D),D.castShadow&&g++),i.spotLightMatrix[B]=V.matrix,D.castShadow){const Z=t.get(D);Z.shadowIntensity=V.intensity,Z.shadowBias=V.bias,Z.shadowNormalBias=V.normalBias,Z.shadowRadius=V.radius,Z.shadowMapSize=V.mapSize,i.spotShadow[B]=Z,i.spotShadowMap[B]=k,m++}B++}else if(D.isRectAreaLight){const q=n.get(D);q.color.copy(O).multiplyScalar(j),q.halfWidth.set(D.width*.5,0,0),q.halfHeight.set(0,D.height*.5,0),i.rectArea[u]=q,u++}else if(D.isPointLight){const q=n.get(D);if(q.color.copy(D.color).multiplyScalar(D.intensity),q.distance=D.distance,q.decay=D.decay,D.castShadow){const V=D.shadow,Z=t.get(D);Z.shadowIntensity=V.intensity,Z.shadowBias=V.bias,Z.shadowNormalBias=V.normalBias,Z.shadowRadius=V.radius,Z.shadowMapSize=V.mapSize,Z.shadowCameraNear=V.camera.near,Z.shadowCameraFar=V.camera.far,i.pointShadow[C]=Z,i.pointShadowMap[C]=k,i.pointShadowMatrix[C]=D.shadow.matrix,I++}i.point[C]=q,C++}else if(D.isHemisphereLight){const q=n.get(D);q.skyColor.copy(D.color).multiplyScalar(j),q.groundColor.copy(D.groundColor).multiplyScalar(j),i.hemi[c]=q,c++}}u>0&&(e.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=le.LTC_FLOAT_1,i.rectAreaLTC2=le.LTC_FLOAT_2):(i.rectAreaLTC1=le.LTC_HALF_1,i.rectAreaLTC2=le.LTC_HALF_2)),i.ambient[0]=G,i.ambient[1]=R,i.ambient[2]=h;const f=i.hash;(f.directionalLength!==S||f.pointLength!==C||f.spotLength!==B||f.rectAreaLength!==u||f.hemiLength!==c||f.numDirectionalShadows!==y||f.numPointShadows!==I||f.numSpotShadows!==m||f.numSpotMaps!==A||f.numLightProbes!==P)&&(i.directional.length=S,i.spot.length=B,i.rectArea.length=u,i.point.length=C,i.hemi.length=c,i.directionalShadow.length=y,i.directionalShadowMap.length=y,i.pointShadow.length=I,i.pointShadowMap.length=I,i.spotShadow.length=m,i.spotShadowMap.length=m,i.directionalShadowMatrix.length=y,i.pointShadowMatrix.length=I,i.spotLightMatrix.length=m+A-g,i.spotLightMap.length=A,i.numSpotLightShadowsWithMaps=g,i.numLightProbes=P,f.directionalLength=S,f.pointLength=C,f.spotLength=B,f.rectAreaLength=u,f.hemiLength=c,f.numDirectionalShadows=y,f.numPointShadows=I,f.numSpotShadows=m,f.numSpotMaps=A,f.numLightProbes=P,i.version=od++)}function T(v,G){let R=0,h=0,S=0,C=0,B=0;const u=G.matrixWorldInverse;for(let c=0,y=v.length;c<y;c++){const I=v[c];if(I.isDirectionalLight){const m=i.directional[R];m.direction.setFromMatrixPosition(I.matrixWorld),a.setFromMatrixPosition(I.target.matrixWorld),m.direction.sub(a),m.direction.transformDirection(u),R++}else if(I.isSpotLight){const m=i.spot[S];m.position.setFromMatrixPosition(I.matrixWorld),m.position.applyMatrix4(u),m.direction.setFromMatrixPosition(I.matrixWorld),a.setFromMatrixPosition(I.target.matrixWorld),m.direction.sub(a),m.direction.transformDirection(u),S++}else if(I.isRectAreaLight){const m=i.rectArea[C];m.position.setFromMatrixPosition(I.matrixWorld),m.position.applyMatrix4(u),s.identity(),o.copy(I.matrixWorld),o.premultiply(u),s.extractRotation(o),m.halfWidth.set(I.width*.5,0,0),m.halfHeight.set(0,I.height*.5,0),m.halfWidth.applyMatrix4(s),m.halfHeight.applyMatrix4(s),C++}else if(I.isPointLight){const m=i.point[h];m.position.setFromMatrixPosition(I.matrixWorld),m.position.applyMatrix4(u),h++}else if(I.isHemisphereLight){const m=i.hemi[B];m.direction.setFromMatrixPosition(I.matrixWorld),m.direction.transformDirection(u),B++}}}return{setup:d,setupView:T,state:i}}function Ka(e){const n=new ld(e),t=[],i=[],a=[];function o(h){R.camera=h,t.length=0,i.length=0,a.length=0}function s(h){t.push(h)}function d(h){i.push(h)}function T(h){a.push(h)}function v(){n.setup(t)}function G(h){n.setupView(t,h)}const R={lightsArray:t,shadowsArray:i,lightProbeGridArray:a,camera:null,lights:n,transmissionRenderTarget:{},textureUnits:0};return{init:o,state:R,setupLights:v,setupLightsView:G,pushLight:s,pushShadow:d,pushLightProbeGrid:T}}function cd(e){let n=new WeakMap;function t(a,o=0){const s=n.get(a);let d;return s===void 0?(d=new Ka(e),n.set(a,[d])):o>=s.length?(d=new Ka(e),s.push(d)):d=s[o],d}function i(){n=new WeakMap}return{get:t,dispose:i}}const fd=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,ud=`uniform sampler2D shadow_pass;
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
}`,dd=[new ye(1,0,0),new ye(-1,0,0),new ye(0,1,0),new ye(0,-1,0),new ye(0,0,1),new ye(0,0,-1)],pd=[new ye(0,-1,0),new ye(0,-1,0),new ye(0,0,1),new ye(0,0,-1),new ye(0,-1,0),new ye(0,-1,0)],$a=new an,Sn=new ye,fi=new ye;function hd(e,n,t){let i=new bi;const a=new it,o=new it,s=new ht,d=new Wo,T=new ko,v={},G=t.maxTextureSize,R={[Tn]:bt,[bt]:Tn,[Ot]:Ot},h=new kt({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new it},radius:{value:4}},vertexShader:fd,fragmentShader:ud}),S=h.clone();S.defines.HORIZONTAL_PASS=1;const C=new Pn;C.setAttribute("position",new On(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const B=new Wt(C,h),u=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Bn;let c=this.type;this.render=function(g,P,f){if(u.enabled===!1||u.autoUpdate===!1&&u.needsUpdate===!1||g.length===0)return;this.type===zo&&(Ve("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=Bn);const _=e.getRenderTarget(),N=e.getActiveCubeFace(),D=e.getActiveMipmapLevel(),O=e.state;O.setBlending(zt),O.buffers.depth.getReversed()===!0?O.buffers.color.setClear(0,0,0,0):O.buffers.color.setClear(1,1,1,1),O.buffers.depth.setTest(!0),O.setScissorTest(!1);const j=c!==this.type;j&&P.traverse(function(K){K.material&&(Array.isArray(K.material)?K.material.forEach(k=>k.needsUpdate=!0):K.material.needsUpdate=!0)});for(let K=0,k=g.length;K<k;K++){const q=g[K],V=q.shadow;if(V===void 0){Ve("WebGLShadowMap:",q,"has no shadow.");continue}if(V.autoUpdate===!1&&V.needsUpdate===!1)continue;a.copy(V.mapSize);const Z=V.getFrameExtents();a.multiply(Z),o.copy(V.mapSize),(a.x>G||a.y>G)&&(a.x>G&&(o.x=Math.floor(G/Z.x),a.x=o.x*Z.x,V.mapSize.x=o.x),a.y>G&&(o.y=Math.floor(G/Z.y),a.y=o.y*Z.y,V.mapSize.y=o.y));const ee=e.state.buffers.depth.getReversed();if(V.camera._reversedDepth=ee,V.map===null||j===!0){if(V.map!==null&&(V.map.depthTexture!==null&&(V.map.depthTexture.dispose(),V.map.depthTexture=null),V.map.dispose()),this.type===En){if(q.isPointLight){Ve("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}V.map=new wt(a.x,a.y,{format:on,type:Vt,minFilter:gt,magFilter:gt,generateMipmaps:!1}),V.map.texture.name=q.name+".shadowMap",V.map.depthTexture=new An(a.x,a.y,Zt),V.map.depthTexture.name=q.name+".shadowMapDepth",V.map.depthTexture.format=pn,V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=tn,V.map.depthTexture.magFilter=tn}else q.isPointLight?(V.map=new Hr(a.x),V.map.depthTexture=new Xo(a.x,rn)):(V.map=new wt(a.x,a.y),V.map.depthTexture=new An(a.x,a.y,rn)),V.map.depthTexture.name=q.name+".shadowMap",V.map.depthTexture.format=pn,this.type===Bn?(V.map.depthTexture.compareFunction=ee?Ci:Di,V.map.depthTexture.minFilter=gt,V.map.depthTexture.magFilter=gt):(V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=tn,V.map.depthTexture.magFilter=tn);V.camera.updateProjectionMatrix()}const ce=V.map.isWebGLCubeRenderTarget?6:1;for(let _e=0;_e<ce;_e++){if(V.map.isWebGLCubeRenderTarget)e.setRenderTarget(V.map,_e),e.clear();else{_e===0&&(e.setRenderTarget(V.map),e.clear());const ve=V.getViewport(_e);s.set(o.x*ve.x,o.y*ve.y,o.x*ve.z,o.y*ve.w),O.viewport(s)}if(q.isPointLight){const ve=V.camera,Oe=V.matrix,Qe=q.distance||ve.far;Qe!==ve.far&&(ve.far=Qe,ve.updateProjectionMatrix()),Sn.setFromMatrixPosition(q.matrixWorld),ve.position.copy(Sn),fi.copy(ve.position),fi.add(dd[_e]),ve.up.copy(pd[_e]),ve.lookAt(fi),ve.updateMatrixWorld(),Oe.makeTranslation(-Sn.x,-Sn.y,-Sn.z),$a.multiplyMatrices(ve.projectionMatrix,ve.matrixWorldInverse),V._frustum.setFromProjectionMatrix($a,ve.coordinateSystem,ve.reversedDepth)}else V.updateMatrices(q);i=V.getFrustum(),m(P,f,V.camera,q,this.type)}V.isPointLightShadow!==!0&&this.type===En&&y(V,f),V.needsUpdate=!1}c=this.type,u.needsUpdate=!1,e.setRenderTarget(_,N,D)};function y(g,P){const f=n.update(B);h.defines.VSM_SAMPLES!==g.blurSamples&&(h.defines.VSM_SAMPLES=g.blurSamples,S.defines.VSM_SAMPLES=g.blurSamples,h.needsUpdate=!0,S.needsUpdate=!0),g.mapPass===null&&(g.mapPass=new wt(a.x,a.y,{format:on,type:Vt})),h.uniforms.shadow_pass.value=g.map.depthTexture,h.uniforms.resolution.value=g.mapSize,h.uniforms.radius.value=g.radius,e.setRenderTarget(g.mapPass),e.clear(),e.renderBufferDirect(P,null,f,h,B,null),S.uniforms.shadow_pass.value=g.mapPass.texture,S.uniforms.resolution.value=g.mapSize,S.uniforms.radius.value=g.radius,e.setRenderTarget(g.map),e.clear(),e.renderBufferDirect(P,null,f,S,B,null)}function I(g,P,f,_){let N=null;const D=f.isPointLight===!0?g.customDistanceMaterial:g.customDepthMaterial;if(D!==void 0)N=D;else if(N=f.isPointLight===!0?T:d,e.localClippingEnabled&&P.clipShadows===!0&&Array.isArray(P.clippingPlanes)&&P.clippingPlanes.length!==0||P.displacementMap&&P.displacementScale!==0||P.alphaMap&&P.alphaTest>0||P.map&&P.alphaTest>0||P.alphaToCoverage===!0){const O=N.uuid,j=P.uuid;let K=v[O];K===void 0&&(K={},v[O]=K);let k=K[j];k===void 0&&(k=N.clone(),K[j]=k,P.addEventListener("dispose",A)),N=k}if(N.visible=P.visible,N.wireframe=P.wireframe,_===En?N.side=P.shadowSide!==null?P.shadowSide:P.side:N.side=P.shadowSide!==null?P.shadowSide:R[P.side],N.alphaMap=P.alphaMap,N.alphaTest=P.alphaToCoverage===!0?.5:P.alphaTest,N.map=P.map,N.clipShadows=P.clipShadows,N.clippingPlanes=P.clippingPlanes,N.clipIntersection=P.clipIntersection,N.displacementMap=P.displacementMap,N.displacementScale=P.displacementScale,N.displacementBias=P.displacementBias,N.wireframeLinewidth=P.wireframeLinewidth,N.linewidth=P.linewidth,f.isPointLight===!0&&N.isMeshDistanceMaterial===!0){const O=e.properties.get(N);O.light=f}return N}function m(g,P,f,_,N){if(g.visible===!1)return;if(g.layers.test(P.layers)&&(g.isMesh||g.isLine||g.isPoints)&&(g.castShadow||g.receiveShadow&&N===En)&&(!g.frustumCulled||i.intersectsObject(g))){g.modelViewMatrix.multiplyMatrices(f.matrixWorldInverse,g.matrixWorld);const j=n.update(g),K=g.material;if(Array.isArray(K)){const k=j.groups;for(let q=0,V=k.length;q<V;q++){const Z=k[q],ee=K[Z.materialIndex];if(ee&&ee.visible){const ce=I(g,ee,_,N);g.onBeforeShadow(e,g,P,f,j,ce,Z),e.renderBufferDirect(f,null,j,ce,g,Z),g.onAfterShadow(e,g,P,f,j,ce,Z)}}}else if(K.visible){const k=I(g,K,_,N);g.onBeforeShadow(e,g,P,f,j,k,null),e.renderBufferDirect(f,null,j,k,g,null),g.onAfterShadow(e,g,P,f,j,k,null)}}const O=g.children;for(let j=0,K=O.length;j<K;j++)m(O[j],P,f,_,N)}function A(g){g.target.removeEventListener("dispose",A);for(const f in v){const _=v[f],N=g.target.uuid;N in _&&(_[N].dispose(),delete _[N])}}}function md(e,n){function t(){let E=!1;const te=new ht;let X=null;const oe=new ht(0,0,0,0);return{setMask:function(de){X!==de&&!E&&(e.colorMask(de,de,de,de),X=de)},setLocked:function(de){E=de},setClear:function(de,$,Se,me,tt){tt===!0&&(de*=me,$*=me,Se*=me),te.set(de,$,Se,me),oe.equals(te)===!1&&(e.clearColor(de,$,Se,me),oe.copy(te))},reset:function(){E=!1,X=null,oe.set(-1,0,0,0)}}}function i(){let E=!1,te=!1,X=null,oe=null,de=null;return{setReversed:function($){if(te!==$){const Se=n.get("EXT_clip_control");$?Se.clipControlEXT(Se.LOWER_LEFT_EXT,Se.ZERO_TO_ONE_EXT):Se.clipControlEXT(Se.LOWER_LEFT_EXT,Se.NEGATIVE_ONE_TO_ONE_EXT),te=$;const me=de;de=null,this.setClear(me)}},getReversed:function(){return te},setTest:function($){$?Q(e.DEPTH_TEST):Re(e.DEPTH_TEST)},setMask:function($){X!==$&&!E&&(e.depthMask($),X=$)},setFunc:function($){if(te&&($=Ms[$]),oe!==$){switch($){case os:e.depthFunc(e.NEVER);break;case rs:e.depthFunc(e.ALWAYS);break;case as:e.depthFunc(e.LESS);break;case ki:e.depthFunc(e.LEQUAL);break;case is:e.depthFunc(e.EQUAL);break;case ns:e.depthFunc(e.GEQUAL);break;case ts:e.depthFunc(e.GREATER);break;case es:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}oe=$}},setLocked:function($){E=$},setClear:function($){de!==$&&(de=$,te&&($=1-$),e.clearDepth($))},reset:function(){E=!1,X=null,oe=null,de=null,te=!1}}}function a(){let E=!1,te=null,X=null,oe=null,de=null,$=null,Se=null,me=null,tt=null;return{setTest:function(Ke){E||(Ke?Q(e.STENCIL_TEST):Re(e.STENCIL_TEST))},setMask:function(Ke){te!==Ke&&!E&&(e.stencilMask(Ke),te=Ke)},setFunc:function(Ke,Lt,Ut){(X!==Ke||oe!==Lt||de!==Ut)&&(e.stencilFunc(Ke,Lt,Ut),X=Ke,oe=Lt,de=Ut)},setOp:function(Ke,Lt,Ut){($!==Ke||Se!==Lt||me!==Ut)&&(e.stencilOp(Ke,Lt,Ut),$=Ke,Se=Lt,me=Ut)},setLocked:function(Ke){E=Ke},setClear:function(Ke){tt!==Ke&&(e.clearStencil(Ke),tt=Ke)},reset:function(){E=!1,te=null,X=null,oe=null,de=null,$=null,Se=null,me=null,tt=null}}}const o=new t,s=new i,d=new a,T=new WeakMap,v=new WeakMap;let G={},R={},h={},S=new WeakMap,C=[],B=null,u=!1,c=null,y=null,I=null,m=null,A=null,g=null,P=null,f=new Ye(0,0,0),_=0,N=!1,D=null,O=null,j=null,K=null,k=null;const q=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let V=!1,Z=0;const ee=e.getParameter(e.VERSION);ee.indexOf("WebGL")!==-1?(Z=parseFloat(/^WebGL (\d)/.exec(ee)[1]),V=Z>=1):ee.indexOf("OpenGL ES")!==-1&&(Z=parseFloat(/^OpenGL ES (\d)/.exec(ee)[1]),V=Z>=2);let ce=null,_e={};const ve=e.getParameter(e.SCISSOR_BOX),Oe=e.getParameter(e.VIEWPORT),Qe=new ht().fromArray(ve),Be=new ht().fromArray(Oe);function z(E,te,X,oe){const de=new Uint8Array(4),$=e.createTexture();e.bindTexture(E,$),e.texParameteri(E,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(E,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let Se=0;Se<X;Se++)E===e.TEXTURE_3D||E===e.TEXTURE_2D_ARRAY?e.texImage3D(te,0,e.RGBA,1,1,oe,0,e.RGBA,e.UNSIGNED_BYTE,de):e.texImage2D(te+Se,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,de);return $}const ne={};ne[e.TEXTURE_2D]=z(e.TEXTURE_2D,e.TEXTURE_2D,1),ne[e.TEXTURE_CUBE_MAP]=z(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),ne[e.TEXTURE_2D_ARRAY]=z(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),ne[e.TEXTURE_3D]=z(e.TEXTURE_3D,e.TEXTURE_3D,1,1),o.setClear(0,0,0,1),s.setClear(1),d.setClear(0),Q(e.DEPTH_TEST),s.setFunc(ki),st(!1),ct(Ea),Q(e.CULL_FACE),He(zt);function Q(E){G[E]!==!0&&(e.enable(E),G[E]=!0)}function Re(E){G[E]!==!1&&(e.disable(E),G[E]=!1)}function Ce(E,te){return h[E]!==te?(e.bindFramebuffer(E,te),h[E]=te,E===e.DRAW_FRAMEBUFFER&&(h[e.FRAMEBUFFER]=te),E===e.FRAMEBUFFER&&(h[e.DRAW_FRAMEBUFFER]=te),!0):!1}function Ae(E,te){let X=C,oe=!1;if(E){X=S.get(te),X===void 0&&(X=[],S.set(te,X));const de=E.textures;if(X.length!==de.length||X[0]!==e.COLOR_ATTACHMENT0){for(let $=0,Se=de.length;$<Se;$++)X[$]=e.COLOR_ATTACHMENT0+$;X.length=de.length,oe=!0}}else X[0]!==e.BACK&&(X[0]=e.BACK,oe=!0);oe&&e.drawBuffers(X)}function at(E){return B!==E?(e.useProgram(E),B=E,!0):!1}const Ie={[gn]:e.FUNC_ADD,[go]:e.FUNC_SUBTRACT,[_o]:e.FUNC_REVERSE_SUBTRACT};Ie[Ts]=e.MIN,Ie[As]=e.MAX;const ze={[Uo]:e.ZERO,[Lo]:e.ONE,[wo]:e.SRC_COLOR,[Po]:e.SRC_ALPHA,[Do]:e.SRC_ALPHA_SATURATE,[Co]:e.DST_COLOR,[Ro]:e.DST_ALPHA,[bo]:e.ONE_MINUS_SRC_COLOR,[Ao]:e.ONE_MINUS_SRC_ALPHA,[To]:e.ONE_MINUS_DST_COLOR,[Mo]:e.ONE_MINUS_DST_ALPHA,[xo]:e.CONSTANT_COLOR,[Eo]:e.ONE_MINUS_CONSTANT_COLOR,[So]:e.CONSTANT_ALPHA,[vo]:e.ONE_MINUS_CONSTANT_ALPHA};function He(E,te,X,oe,de,$,Se,me,tt,Ke){if(E===zt){u===!0&&(Re(e.BLEND),u=!1);return}if(u===!1&&(Q(e.BLEND),u=!0),E!==cs){if(E!==c||Ke!==N){if((y!==gn||A!==gn)&&(e.blendEquation(e.FUNC_ADD),y=gn,A=gn),Ke)switch(E){case Hn:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case Ta:e.blendFunc(e.ONE,e.ONE);break;case Ma:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case xa:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:je("WebGLState: Invalid blending: ",E);break}else switch(E){case Hn:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case Ta:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case Ma:je("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case xa:je("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:je("WebGLState: Invalid blending: ",E);break}I=null,m=null,g=null,P=null,f.set(0,0,0),_=0,c=E,N=Ke}return}de=de||te,$=$||X,Se=Se||oe,(te!==y||de!==A)&&(e.blendEquationSeparate(Ie[te],Ie[de]),y=te,A=de),(X!==I||oe!==m||$!==g||Se!==P)&&(e.blendFuncSeparate(ze[X],ze[oe],ze[$],ze[Se]),I=X,m=oe,g=$,P=Se),(me.equals(f)===!1||tt!==_)&&(e.blendColor(me.r,me.g,me.b,tt),f.copy(me),_=tt),c=E,N=!1}function Fe(E,te){E.side===Ot?Re(e.CULL_FACE):Q(e.CULL_FACE);let X=E.side===bt;te&&(X=!X),st(X),E.blending===Hn&&E.transparent===!1?He(zt):He(E.blending,E.blendEquation,E.blendSrc,E.blendDst,E.blendEquationAlpha,E.blendSrcAlpha,E.blendDstAlpha,E.blendColor,E.blendAlpha,E.premultipliedAlpha),s.setFunc(E.depthFunc),s.setTest(E.depthTest),s.setMask(E.depthWrite),o.setMask(E.colorWrite);const oe=E.stencilWrite;d.setTest(oe),oe&&(d.setMask(E.stencilWriteMask),d.setFunc(E.stencilFunc,E.stencilRef,E.stencilFuncMask),d.setOp(E.stencilFail,E.stencilZFail,E.stencilZPass)),mt(E.polygonOffset,E.polygonOffsetFactor,E.polygonOffsetUnits),E.alphaToCoverage===!0?Q(e.SAMPLE_ALPHA_TO_COVERAGE):Re(e.SAMPLE_ALPHA_TO_COVERAGE)}function st(E){D!==E&&(E?e.frontFace(e.CW):e.frontFace(e.CCW),D=E)}function ct(E){E!==ss?(Q(e.CULL_FACE),E!==O&&(E===Ea?e.cullFace(e.BACK):E===ls?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))):Re(e.CULL_FACE),O=E}function dt(E){E!==j&&(V&&e.lineWidth(E),j=E)}function mt(E,te,X){E?(Q(e.POLYGON_OFFSET_FILL),(K!==te||k!==X)&&(K=te,k=X,s.getReversed()&&(te=-te),e.polygonOffset(te,X))):Re(e.POLYGON_OFFSET_FILL)}function et(E){E?Q(e.SCISSOR_TEST):Re(e.SCISSOR_TEST)}function lt(E){E===void 0&&(E=e.TEXTURE0+q-1),ce!==E&&(e.activeTexture(E),ce=E)}function x(E,te,X){X===void 0&&(ce===null?X=e.TEXTURE0+q-1:X=ce);let oe=_e[X];oe===void 0&&(oe={type:void 0,texture:void 0},_e[X]=oe),(oe.type!==E||oe.texture!==te)&&(ce!==X&&(e.activeTexture(X),ce=X),e.bindTexture(E,te||ne[E]),oe.type=E,oe.texture=te)}function xt(){const E=_e[ce];E!==void 0&&E.type!==void 0&&(e.bindTexture(E.type,null),E.type=void 0,E.texture=void 0)}function We(){try{e.compressedTexImage2D(...arguments)}catch(E){je("WebGLState:",E)}}function p(){try{e.compressedTexImage3D(...arguments)}catch(E){je("WebGLState:",E)}}function r(){try{e.texSubImage2D(...arguments)}catch(E){je("WebGLState:",E)}}function b(){try{e.texSubImage3D(...arguments)}catch(E){je("WebGLState:",E)}}function U(){try{e.compressedTexSubImage2D(...arguments)}catch(E){je("WebGLState:",E)}}function H(){try{e.compressedTexSubImage3D(...arguments)}catch(E){je("WebGLState:",E)}}function J(){try{e.texStorage2D(...arguments)}catch(E){je("WebGLState:",E)}}function ie(){try{e.texStorage3D(...arguments)}catch(E){je("WebGLState:",E)}}function W(){try{e.texImage2D(...arguments)}catch(E){je("WebGLState:",E)}}function Y(){try{e.texImage3D(...arguments)}catch(E){je("WebGLState:",E)}}function ae(E){return R[E]!==void 0?R[E]:e.getParameter(E)}function Ee(E,te){R[E]!==te&&(e.pixelStorei(E,te),R[E]=te)}function se(E){Qe.equals(E)===!1&&(e.scissor(E.x,E.y,E.z,E.w),Qe.copy(E))}function re(E){Be.equals(E)===!1&&(e.viewport(E.x,E.y,E.z,E.w),Be.copy(E))}function Te(E,te){let X=v.get(te);X===void 0&&(X=new WeakMap,v.set(te,X));let oe=X.get(E);oe===void 0&&(oe=e.getUniformBlockIndex(te,E.name),X.set(E,oe))}function be(E,te){const oe=v.get(te).get(E);T.get(te)!==oe&&(e.uniformBlockBinding(te,oe,E.__bindingPointIndex),T.set(te,oe))}function De(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),s.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),G={},R={},ce=null,_e={},h={},S=new WeakMap,C=[],B=null,u=!1,c=null,y=null,I=null,m=null,A=null,g=null,P=null,f=new Ye(0,0,0),_=0,N=!1,D=null,O=null,j=null,K=null,k=null,Qe.set(0,0,e.canvas.width,e.canvas.height),Be.set(0,0,e.canvas.width,e.canvas.height),o.reset(),s.reset(),d.reset()}return{buffers:{color:o,depth:s,stencil:d},enable:Q,disable:Re,bindFramebuffer:Ce,drawBuffers:Ae,useProgram:at,setBlending:He,setMaterial:Fe,setFlipSided:st,setCullFace:ct,setLineWidth:dt,setPolygonOffset:mt,setScissorTest:et,activeTexture:lt,bindTexture:x,unbindTexture:xt,compressedTexImage2D:We,compressedTexImage3D:p,texImage2D:W,texImage3D:Y,pixelStorei:Ee,getParameter:ae,updateUBOMapping:Te,uniformBlockBinding:be,texStorage2D:J,texStorage3D:ie,texSubImage2D:r,texSubImage3D:b,compressedTexSubImage2D:U,compressedTexSubImage3D:H,scissor:se,viewport:re,reset:De}}function _d(e,n,t,i,a,o,s){const d=n.has("WEBGL_multisampled_render_to_texture")?n.get("WEBGL_multisampled_render_to_texture"):null,T=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),v=new it,G=new WeakMap,R=new Set;let h;const S=new WeakMap;let C=!1;try{C=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function B(p,r){return C?new OffscreenCanvas(p,r):gs("canvas")}function u(p,r,b){let U=1;const H=We(p);if((H.width>b||H.height>b)&&(U=b/Math.max(H.width,H.height)),U<1)if(typeof HTMLImageElement<"u"&&p instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&p instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&p instanceof ImageBitmap||typeof VideoFrame<"u"&&p instanceof VideoFrame){const J=Math.floor(U*H.width),ie=Math.floor(U*H.height);h===void 0&&(h=B(J,ie));const W=r?B(J,ie):h;return W.width=J,W.height=ie,W.getContext("2d").drawImage(p,0,0,J,ie),Ve("WebGLRenderer: Texture has been resized from ("+H.width+"x"+H.height+") to ("+J+"x"+ie+")."),W}else return"data"in p&&Ve("WebGLRenderer: Image in DataTexture is too big ("+H.width+"x"+H.height+")."),p;return p}function c(p){return p.generateMipmaps}function y(p){e.generateMipmap(p)}function I(p){return p.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:p.isWebGL3DRenderTarget?e.TEXTURE_3D:p.isWebGLArrayRenderTarget||p.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function m(p,r,b,U,H,J=!1){if(p!==null){if(e[p]!==void 0)return e[p];Ve("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+p+"'")}let ie;U&&(ie=n.get("EXT_texture_norm16"),ie||Ve("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let W=r;if(r===e.RED&&(b===e.FLOAT&&(W=e.R32F),b===e.HALF_FLOAT&&(W=e.R16F),b===e.UNSIGNED_BYTE&&(W=e.R8),b===e.UNSIGNED_SHORT&&ie&&(W=ie.R16_EXT),b===e.SHORT&&ie&&(W=ie.R16_SNORM_EXT)),r===e.RED_INTEGER&&(b===e.UNSIGNED_BYTE&&(W=e.R8UI),b===e.UNSIGNED_SHORT&&(W=e.R16UI),b===e.UNSIGNED_INT&&(W=e.R32UI),b===e.BYTE&&(W=e.R8I),b===e.SHORT&&(W=e.R16I),b===e.INT&&(W=e.R32I)),r===e.RG&&(b===e.FLOAT&&(W=e.RG32F),b===e.HALF_FLOAT&&(W=e.RG16F),b===e.UNSIGNED_BYTE&&(W=e.RG8),b===e.UNSIGNED_SHORT&&ie&&(W=ie.RG16_EXT),b===e.SHORT&&ie&&(W=ie.RG16_SNORM_EXT)),r===e.RG_INTEGER&&(b===e.UNSIGNED_BYTE&&(W=e.RG8UI),b===e.UNSIGNED_SHORT&&(W=e.RG16UI),b===e.UNSIGNED_INT&&(W=e.RG32UI),b===e.BYTE&&(W=e.RG8I),b===e.SHORT&&(W=e.RG16I),b===e.INT&&(W=e.RG32I)),r===e.RGB_INTEGER&&(b===e.UNSIGNED_BYTE&&(W=e.RGB8UI),b===e.UNSIGNED_SHORT&&(W=e.RGB16UI),b===e.UNSIGNED_INT&&(W=e.RGB32UI),b===e.BYTE&&(W=e.RGB8I),b===e.SHORT&&(W=e.RGB16I),b===e.INT&&(W=e.RGB32I)),r===e.RGBA_INTEGER&&(b===e.UNSIGNED_BYTE&&(W=e.RGBA8UI),b===e.UNSIGNED_SHORT&&(W=e.RGBA16UI),b===e.UNSIGNED_INT&&(W=e.RGBA32UI),b===e.BYTE&&(W=e.RGBA8I),b===e.SHORT&&(W=e.RGBA16I),b===e.INT&&(W=e.RGBA32I)),r===e.RGB&&(b===e.UNSIGNED_SHORT&&ie&&(W=ie.RGB16_EXT),b===e.SHORT&&ie&&(W=ie.RGB16_SNORM_EXT),b===e.UNSIGNED_INT_5_9_9_9_REV&&(W=e.RGB9_E5),b===e.UNSIGNED_INT_10F_11F_11F_REV&&(W=e.R11F_G11F_B10F)),r===e.RGBA){const Y=J?Gr:Je.getTransfer(H);b===e.FLOAT&&(W=e.RGBA32F),b===e.HALF_FLOAT&&(W=e.RGBA16F),b===e.UNSIGNED_BYTE&&(W=Y===Ze?e.SRGB8_ALPHA8:e.RGBA8),b===e.UNSIGNED_SHORT&&ie&&(W=ie.RGBA16_EXT),b===e.SHORT&&ie&&(W=ie.RGBA16_SNORM_EXT),b===e.UNSIGNED_SHORT_4_4_4_4&&(W=e.RGBA4),b===e.UNSIGNED_SHORT_5_5_5_1&&(W=e.RGB5_A1)}return(W===e.R16F||W===e.R32F||W===e.RG16F||W===e.RG32F||W===e.RGBA16F||W===e.RGBA32F)&&n.get("EXT_color_buffer_float"),W}function A(p,r){let b;return p?r===null||r===rn||r===bn?b=e.DEPTH24_STENCIL8:r===Zt?b=e.DEPTH32F_STENCIL8:r===Wn&&(b=e.DEPTH24_STENCIL8,Ve("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):r===null||r===rn||r===bn?b=e.DEPTH_COMPONENT24:r===Zt?b=e.DEPTH_COMPONENT32F:r===Wn&&(b=e.DEPTH_COMPONENT16),b}function g(p,r){return c(p)===!0||p.isFramebufferTexture&&p.minFilter!==tn&&p.minFilter!==gt?Math.log2(Math.max(r.width,r.height))+1:p.mipmaps!==void 0&&p.mipmaps.length>0?p.mipmaps.length:p.isCompressedTexture&&Array.isArray(p.image)?r.mipmaps.length:1}function P(p){const r=p.target;r.removeEventListener("dispose",P),_(r),r.isVideoTexture&&G.delete(r),r.isHTMLTexture&&R.delete(r)}function f(p){const r=p.target;r.removeEventListener("dispose",f),D(r)}function _(p){const r=i.get(p);if(r.__webglInit===void 0)return;const b=p.source,U=S.get(b);if(U){const H=U[r.__cacheKey];H.usedTimes--,H.usedTimes===0&&N(p),Object.keys(U).length===0&&S.delete(b)}i.remove(p)}function N(p){const r=i.get(p);e.deleteTexture(r.__webglTexture);const b=p.source,U=S.get(b);delete U[r.__cacheKey],s.memory.textures--}function D(p){const r=i.get(p);if(p.depthTexture&&(p.depthTexture.dispose(),i.remove(p.depthTexture)),p.isWebGLCubeRenderTarget)for(let U=0;U<6;U++){if(Array.isArray(r.__webglFramebuffer[U]))for(let H=0;H<r.__webglFramebuffer[U].length;H++)e.deleteFramebuffer(r.__webglFramebuffer[U][H]);else e.deleteFramebuffer(r.__webglFramebuffer[U]);r.__webglDepthbuffer&&e.deleteRenderbuffer(r.__webglDepthbuffer[U])}else{if(Array.isArray(r.__webglFramebuffer))for(let U=0;U<r.__webglFramebuffer.length;U++)e.deleteFramebuffer(r.__webglFramebuffer[U]);else e.deleteFramebuffer(r.__webglFramebuffer);if(r.__webglDepthbuffer&&e.deleteRenderbuffer(r.__webglDepthbuffer),r.__webglMultisampledFramebuffer&&e.deleteFramebuffer(r.__webglMultisampledFramebuffer),r.__webglColorRenderbuffer)for(let U=0;U<r.__webglColorRenderbuffer.length;U++)r.__webglColorRenderbuffer[U]&&e.deleteRenderbuffer(r.__webglColorRenderbuffer[U]);r.__webglDepthRenderbuffer&&e.deleteRenderbuffer(r.__webglDepthRenderbuffer)}const b=p.textures;for(let U=0,H=b.length;U<H;U++){const J=i.get(b[U]);J.__webglTexture&&(e.deleteTexture(J.__webglTexture),s.memory.textures--),i.remove(b[U])}i.remove(p)}let O=0;function j(){O=0}function K(){return O}function k(p){O=p}function q(){const p=O;return p>=a.maxTextures&&Ve("WebGLTextures: Trying to use "+p+" texture units while this GPU supports only "+a.maxTextures),O+=1,p}function V(p){const r=[];return r.push(p.wrapS),r.push(p.wrapT),r.push(p.wrapR||0),r.push(p.magFilter),r.push(p.minFilter),r.push(p.anisotropy),r.push(p.internalFormat),r.push(p.format),r.push(p.type),r.push(p.generateMipmaps),r.push(p.premultiplyAlpha),r.push(p.flipY),r.push(p.unpackAlignment),r.push(p.colorSpace),r.join()}function Z(p,r){const b=i.get(p);if(p.isVideoTexture&&x(p),p.isRenderTargetTexture===!1&&p.isExternalTexture!==!0&&p.version>0&&b.__version!==p.version){const U=p.image;if(U===null)Ve("WebGLRenderer: Texture marked for update but no image data found.");else if(U.complete===!1)Ve("WebGLRenderer: Texture marked for update but image is incomplete");else{Re(b,p,r);return}}else p.isExternalTexture&&(b.__webglTexture=p.sourceTexture?p.sourceTexture:null);t.bindTexture(e.TEXTURE_2D,b.__webglTexture,e.TEXTURE0+r)}function ee(p,r){const b=i.get(p);if(p.isRenderTargetTexture===!1&&p.version>0&&b.__version!==p.version){Re(b,p,r);return}else p.isExternalTexture&&(b.__webglTexture=p.sourceTexture?p.sourceTexture:null);t.bindTexture(e.TEXTURE_2D_ARRAY,b.__webglTexture,e.TEXTURE0+r)}function ce(p,r){const b=i.get(p);if(p.isRenderTargetTexture===!1&&p.version>0&&b.__version!==p.version){Re(b,p,r);return}t.bindTexture(e.TEXTURE_3D,b.__webglTexture,e.TEXTURE0+r)}function _e(p,r){const b=i.get(p);if(p.isCubeDepthTexture!==!0&&p.version>0&&b.__version!==p.version){Ce(b,p,r);return}t.bindTexture(e.TEXTURE_CUBE_MAP,b.__webglTexture,e.TEXTURE0+r)}const ve={[vi]:e.REPEAT,[Rn]:e.CLAMP_TO_EDGE,[yo]:e.MIRRORED_REPEAT},Oe={[tn]:e.NEAREST,[Io]:e.NEAREST_MIPMAP_NEAREST,[Un]:e.NEAREST_MIPMAP_LINEAR,[gt]:e.LINEAR,[jn]:e.LINEAR_MIPMAP_NEAREST,[fn]:e.LINEAR_MIPMAP_LINEAR},Qe={[Ho]:e.NEVER,[Bo]:e.ALWAYS,[Oo]:e.LESS,[Di]:e.LEQUAL,[Go]:e.EQUAL,[Ci]:e.GEQUAL,[Fo]:e.GREATER,[No]:e.NOTEQUAL};function Be(p,r){if(r.type===Zt&&n.has("OES_texture_float_linear")===!1&&(r.magFilter===gt||r.magFilter===jn||r.magFilter===Un||r.magFilter===fn||r.minFilter===gt||r.minFilter===jn||r.minFilter===Un||r.minFilter===fn)&&Ve("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),e.texParameteri(p,e.TEXTURE_WRAP_S,ve[r.wrapS]),e.texParameteri(p,e.TEXTURE_WRAP_T,ve[r.wrapT]),(p===e.TEXTURE_3D||p===e.TEXTURE_2D_ARRAY)&&e.texParameteri(p,e.TEXTURE_WRAP_R,ve[r.wrapR]),e.texParameteri(p,e.TEXTURE_MAG_FILTER,Oe[r.magFilter]),e.texParameteri(p,e.TEXTURE_MIN_FILTER,Oe[r.minFilter]),r.compareFunction&&(e.texParameteri(p,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(p,e.TEXTURE_COMPARE_FUNC,Qe[r.compareFunction])),n.has("EXT_texture_filter_anisotropic")===!0){if(r.magFilter===tn||r.minFilter!==Un&&r.minFilter!==fn||r.type===Zt&&n.has("OES_texture_float_linear")===!1)return;if(r.anisotropy>1||i.get(r).__currentAnisotropy){const b=n.get("EXT_texture_filter_anisotropic");e.texParameterf(p,b.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(r.anisotropy,a.getMaxAnisotropy())),i.get(r).__currentAnisotropy=r.anisotropy}}}function z(p,r){let b=!1;p.__webglInit===void 0&&(p.__webglInit=!0,r.addEventListener("dispose",P));const U=r.source;let H=S.get(U);H===void 0&&(H={},S.set(U,H));const J=V(r);if(J!==p.__cacheKey){H[J]===void 0&&(H[J]={texture:e.createTexture(),usedTimes:0},s.memory.textures++,b=!0),H[J].usedTimes++;const ie=H[p.__cacheKey];ie!==void 0&&(H[p.__cacheKey].usedTimes--,ie.usedTimes===0&&N(r)),p.__cacheKey=J,p.__webglTexture=H[J].texture}return b}function ne(p,r,b){return Math.floor(Math.floor(p/b)/r)}function Q(p,r,b,U){const J=p.updateRanges;if(J.length===0)t.texSubImage2D(e.TEXTURE_2D,0,0,0,r.width,r.height,b,U,r.data);else{J.sort((Ee,se)=>Ee.start-se.start);let ie=0;for(let Ee=1;Ee<J.length;Ee++){const se=J[ie],re=J[Ee],Te=se.start+se.count,be=ne(re.start,r.width,4),De=ne(se.start,r.width,4);re.start<=Te+1&&be===De&&ne(re.start+re.count-1,r.width,4)===be?se.count=Math.max(se.count,re.start+re.count-se.start):(++ie,J[ie]=re)}J.length=ie+1;const W=t.getParameter(e.UNPACK_ROW_LENGTH),Y=t.getParameter(e.UNPACK_SKIP_PIXELS),ae=t.getParameter(e.UNPACK_SKIP_ROWS);t.pixelStorei(e.UNPACK_ROW_LENGTH,r.width);for(let Ee=0,se=J.length;Ee<se;Ee++){const re=J[Ee],Te=Math.floor(re.start/4),be=Math.ceil(re.count/4),De=Te%r.width,E=Math.floor(Te/r.width),te=be,X=1;t.pixelStorei(e.UNPACK_SKIP_PIXELS,De),t.pixelStorei(e.UNPACK_SKIP_ROWS,E),t.texSubImage2D(e.TEXTURE_2D,0,De,E,te,X,b,U,r.data)}p.clearUpdateRanges(),t.pixelStorei(e.UNPACK_ROW_LENGTH,W),t.pixelStorei(e.UNPACK_SKIP_PIXELS,Y),t.pixelStorei(e.UNPACK_SKIP_ROWS,ae)}}function Re(p,r,b){let U=e.TEXTURE_2D;(r.isDataArrayTexture||r.isCompressedArrayTexture)&&(U=e.TEXTURE_2D_ARRAY),r.isData3DTexture&&(U=e.TEXTURE_3D);const H=z(p,r),J=r.source;t.bindTexture(U,p.__webglTexture,e.TEXTURE0+b);const ie=i.get(J);if(J.version!==ie.__version||H===!0){if(t.activeTexture(e.TEXTURE0+b),(typeof ImageBitmap<"u"&&r.image instanceof ImageBitmap)===!1){const X=Je.getPrimaries(Je.workingColorSpace),oe=r.colorSpace===$t?null:Je.getPrimaries(r.colorSpace),de=r.colorSpace===$t||X===oe?e.NONE:e.BROWSER_DEFAULT_WEBGL;t.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,r.flipY),t.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,r.premultiplyAlpha),t.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,de)}t.pixelStorei(e.UNPACK_ALIGNMENT,r.unpackAlignment);let Y=u(r.image,!1,a.maxTextureSize);Y=xt(r,Y);const ae=o.convert(r.format,r.colorSpace),Ee=o.convert(r.type);let se=m(r.internalFormat,ae,Ee,r.normalized,r.colorSpace,r.isVideoTexture);Be(U,r);let re;const Te=r.mipmaps,be=r.isVideoTexture!==!0,De=ie.__version===void 0||H===!0,E=J.dataReady,te=g(r,Y);if(r.isDepthTexture)se=A(r.format===un,r.type),De&&(be?t.texStorage2D(e.TEXTURE_2D,1,se,Y.width,Y.height):t.texImage2D(e.TEXTURE_2D,0,se,Y.width,Y.height,0,ae,Ee,null));else if(r.isDataTexture)if(Te.length>0){be&&De&&t.texStorage2D(e.TEXTURE_2D,te,se,Te[0].width,Te[0].height);for(let X=0,oe=Te.length;X<oe;X++)re=Te[X],be?E&&t.texSubImage2D(e.TEXTURE_2D,X,0,0,re.width,re.height,ae,Ee,re.data):t.texImage2D(e.TEXTURE_2D,X,se,re.width,re.height,0,ae,Ee,re.data);r.generateMipmaps=!1}else be?(De&&t.texStorage2D(e.TEXTURE_2D,te,se,Y.width,Y.height),E&&Q(r,Y,ae,Ee)):t.texImage2D(e.TEXTURE_2D,0,se,Y.width,Y.height,0,ae,Ee,Y.data);else if(r.isCompressedTexture)if(r.isCompressedArrayTexture){be&&De&&t.texStorage3D(e.TEXTURE_2D_ARRAY,te,se,Te[0].width,Te[0].height,Y.depth);for(let X=0,oe=Te.length;X<oe;X++)if(re=Te[X],r.format!==Bt)if(ae!==null)if(be){if(E)if(r.layerUpdates.size>0){const de=ba(re.width,re.height,r.format,r.type);for(const $ of r.layerUpdates){const Se=re.data.subarray($*de/re.data.BYTES_PER_ELEMENT,($+1)*de/re.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,X,0,0,$,re.width,re.height,1,ae,Se)}r.clearLayerUpdates()}else t.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,X,0,0,0,re.width,re.height,Y.depth,ae,re.data)}else t.compressedTexImage3D(e.TEXTURE_2D_ARRAY,X,se,re.width,re.height,Y.depth,0,re.data,0,0);else Ve("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else be?E&&t.texSubImage3D(e.TEXTURE_2D_ARRAY,X,0,0,0,re.width,re.height,Y.depth,ae,Ee,re.data):t.texImage3D(e.TEXTURE_2D_ARRAY,X,se,re.width,re.height,Y.depth,0,ae,Ee,re.data)}else{be&&De&&t.texStorage2D(e.TEXTURE_2D,te,se,Te[0].width,Te[0].height);for(let X=0,oe=Te.length;X<oe;X++)re=Te[X],r.format!==Bt?ae!==null?be?E&&t.compressedTexSubImage2D(e.TEXTURE_2D,X,0,0,re.width,re.height,ae,re.data):t.compressedTexImage2D(e.TEXTURE_2D,X,se,re.width,re.height,0,re.data):Ve("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):be?E&&t.texSubImage2D(e.TEXTURE_2D,X,0,0,re.width,re.height,ae,Ee,re.data):t.texImage2D(e.TEXTURE_2D,X,se,re.width,re.height,0,ae,Ee,re.data)}else if(r.isDataArrayTexture)if(be){if(De&&t.texStorage3D(e.TEXTURE_2D_ARRAY,te,se,Y.width,Y.height,Y.depth),E)if(r.layerUpdates.size>0){const X=ba(Y.width,Y.height,r.format,r.type);for(const oe of r.layerUpdates){const de=Y.data.subarray(oe*X/Y.data.BYTES_PER_ELEMENT,(oe+1)*X/Y.data.BYTES_PER_ELEMENT);t.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,oe,Y.width,Y.height,1,ae,Ee,de)}r.clearLayerUpdates()}else t.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,Y.width,Y.height,Y.depth,ae,Ee,Y.data)}else t.texImage3D(e.TEXTURE_2D_ARRAY,0,se,Y.width,Y.height,Y.depth,0,ae,Ee,Y.data);else if(r.isData3DTexture)be?(De&&t.texStorage3D(e.TEXTURE_3D,te,se,Y.width,Y.height,Y.depth),E&&t.texSubImage3D(e.TEXTURE_3D,0,0,0,0,Y.width,Y.height,Y.depth,ae,Ee,Y.data)):t.texImage3D(e.TEXTURE_3D,0,se,Y.width,Y.height,Y.depth,0,ae,Ee,Y.data);else if(r.isFramebufferTexture){if(De)if(be)t.texStorage2D(e.TEXTURE_2D,te,se,Y.width,Y.height);else{let X=Y.width,oe=Y.height;for(let de=0;de<te;de++)t.texImage2D(e.TEXTURE_2D,de,se,X,oe,0,ae,Ee,null),X>>=1,oe>>=1}}else if(r.isHTMLTexture){if("texElementImage2D"in e){const X=e.canvas;if(X.hasAttribute("layoutsubtree")||X.setAttribute("layoutsubtree","true"),Y.parentNode!==X){X.appendChild(Y),R.add(r),X.onpaint=oe=>{const de=oe.changedElements;for(const $ of R)de.includes($.image)&&($.needsUpdate=!0)},X.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,Y);else{const de=e.RGBA,$=e.RGBA,Se=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,de,$,Se,Y)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(Te.length>0){if(be&&De){const X=We(Te[0]);t.texStorage2D(e.TEXTURE_2D,te,se,X.width,X.height)}for(let X=0,oe=Te.length;X<oe;X++)re=Te[X],be?E&&t.texSubImage2D(e.TEXTURE_2D,X,0,0,ae,Ee,re):t.texImage2D(e.TEXTURE_2D,X,se,ae,Ee,re);r.generateMipmaps=!1}else if(be){if(De){const X=We(Y);t.texStorage2D(e.TEXTURE_2D,te,se,X.width,X.height)}E&&t.texSubImage2D(e.TEXTURE_2D,0,0,0,ae,Ee,Y)}else t.texImage2D(e.TEXTURE_2D,0,se,ae,Ee,Y);c(r)&&y(U),ie.__version=J.version,r.onUpdate&&r.onUpdate(r)}p.__version=r.version}function Ce(p,r,b){if(r.image.length!==6)return;const U=z(p,r),H=r.source;t.bindTexture(e.TEXTURE_CUBE_MAP,p.__webglTexture,e.TEXTURE0+b);const J=i.get(H);if(H.version!==J.__version||U===!0){t.activeTexture(e.TEXTURE0+b);const ie=Je.getPrimaries(Je.workingColorSpace),W=r.colorSpace===$t?null:Je.getPrimaries(r.colorSpace),Y=r.colorSpace===$t||ie===W?e.NONE:e.BROWSER_DEFAULT_WEBGL;t.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,r.flipY),t.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,r.premultiplyAlpha),t.pixelStorei(e.UNPACK_ALIGNMENT,r.unpackAlignment),t.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,Y);const ae=r.isCompressedTexture||r.image[0].isCompressedTexture,Ee=r.image[0]&&r.image[0].isDataTexture,se=[];for(let $=0;$<6;$++)!ae&&!Ee?se[$]=u(r.image[$],!0,a.maxCubemapSize):se[$]=Ee?r.image[$].image:r.image[$],se[$]=xt(r,se[$]);const re=se[0],Te=o.convert(r.format,r.colorSpace),be=o.convert(r.type),De=m(r.internalFormat,Te,be,r.normalized,r.colorSpace),E=r.isVideoTexture!==!0,te=J.__version===void 0||U===!0,X=H.dataReady;let oe=g(r,re);Be(e.TEXTURE_CUBE_MAP,r);let de;if(ae){E&&te&&t.texStorage2D(e.TEXTURE_CUBE_MAP,oe,De,re.width,re.height);for(let $=0;$<6;$++){de=se[$].mipmaps;for(let Se=0;Se<de.length;Se++){const me=de[Se];r.format!==Bt?Te!==null?E?X&&t.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,Se,0,0,me.width,me.height,Te,me.data):t.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,Se,De,me.width,me.height,0,me.data):Ve("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):E?X&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,Se,0,0,me.width,me.height,Te,be,me.data):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,Se,De,me.width,me.height,0,Te,be,me.data)}}}else{if(de=r.mipmaps,E&&te){de.length>0&&oe++;const $=We(se[0]);t.texStorage2D(e.TEXTURE_CUBE_MAP,oe,De,$.width,$.height)}for(let $=0;$<6;$++)if(Ee){E?X&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,0,0,se[$].width,se[$].height,Te,be,se[$].data):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,De,se[$].width,se[$].height,0,Te,be,se[$].data);for(let Se=0;Se<de.length;Se++){const tt=de[Se].image[$].image;E?X&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,Se+1,0,0,tt.width,tt.height,Te,be,tt.data):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,Se+1,De,tt.width,tt.height,0,Te,be,tt.data)}}else{E?X&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,0,0,Te,be,se[$]):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,De,Te,be,se[$]);for(let Se=0;Se<de.length;Se++){const me=de[Se];E?X&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,Se+1,0,0,Te,be,me.image[$]):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+$,Se+1,De,Te,be,me.image[$])}}}c(r)&&y(e.TEXTURE_CUBE_MAP),J.__version=H.version,r.onUpdate&&r.onUpdate(r)}p.__version=r.version}function Ae(p,r,b,U,H,J){const ie=o.convert(b.format,b.colorSpace),W=o.convert(b.type),Y=m(b.internalFormat,ie,W,b.normalized,b.colorSpace),ae=i.get(r),Ee=i.get(b);if(Ee.__renderTarget=r,!ae.__hasExternalTextures){const se=Math.max(1,r.width>>J),re=Math.max(1,r.height>>J);H===e.TEXTURE_3D||H===e.TEXTURE_2D_ARRAY?t.texImage3D(H,J,Y,se,re,r.depth,0,ie,W,null):t.texImage2D(H,J,Y,se,re,0,ie,W,null)}t.bindFramebuffer(e.FRAMEBUFFER,p),lt(r)?d.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,U,H,Ee.__webglTexture,0,et(r)):(H===e.TEXTURE_2D||H>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&H<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,U,H,Ee.__webglTexture,J),t.bindFramebuffer(e.FRAMEBUFFER,null)}function at(p,r,b){if(e.bindRenderbuffer(e.RENDERBUFFER,p),r.depthBuffer){const U=r.depthTexture,H=U&&U.isDepthTexture?U.type:null,J=A(r.stencilBuffer,H),ie=r.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;lt(r)?d.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,et(r),J,r.width,r.height):b?e.renderbufferStorageMultisample(e.RENDERBUFFER,et(r),J,r.width,r.height):e.renderbufferStorage(e.RENDERBUFFER,J,r.width,r.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,ie,e.RENDERBUFFER,p)}else{const U=r.textures;for(let H=0;H<U.length;H++){const J=U[H],ie=o.convert(J.format,J.colorSpace),W=o.convert(J.type),Y=m(J.internalFormat,ie,W,J.normalized,J.colorSpace);lt(r)?d.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,et(r),Y,r.width,r.height):b?e.renderbufferStorageMultisample(e.RENDERBUFFER,et(r),Y,r.width,r.height):e.renderbufferStorage(e.RENDERBUFFER,Y,r.width,r.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Ie(p,r,b){const U=r.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(e.FRAMEBUFFER,p),!(r.depthTexture&&r.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const H=i.get(r.depthTexture);if(H.__renderTarget=r,(!H.__webglTexture||r.depthTexture.image.width!==r.width||r.depthTexture.image.height!==r.height)&&(r.depthTexture.image.width=r.width,r.depthTexture.image.height=r.height,r.depthTexture.needsUpdate=!0),U){if(H.__webglInit===void 0&&(H.__webglInit=!0,r.depthTexture.addEventListener("dispose",P)),H.__webglTexture===void 0){H.__webglTexture=e.createTexture(),t.bindTexture(e.TEXTURE_CUBE_MAP,H.__webglTexture),Be(e.TEXTURE_CUBE_MAP,r.depthTexture);const ae=o.convert(r.depthTexture.format),Ee=o.convert(r.depthTexture.type);let se;r.depthTexture.format===pn?se=e.DEPTH_COMPONENT24:r.depthTexture.format===un&&(se=e.DEPTH24_STENCIL8);for(let re=0;re<6;re++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+re,0,se,r.width,r.height,0,ae,Ee,null)}}else Z(r.depthTexture,0);const J=H.__webglTexture,ie=et(r),W=U?e.TEXTURE_CUBE_MAP_POSITIVE_X+b:e.TEXTURE_2D,Y=r.depthTexture.format===un?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(r.depthTexture.format===pn)lt(r)?d.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,Y,W,J,0,ie):e.framebufferTexture2D(e.FRAMEBUFFER,Y,W,J,0);else if(r.depthTexture.format===un)lt(r)?d.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,Y,W,J,0,ie):e.framebufferTexture2D(e.FRAMEBUFFER,Y,W,J,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function ze(p){const r=i.get(p),b=p.isWebGLCubeRenderTarget===!0;if(r.__boundDepthTexture!==p.depthTexture){const U=p.depthTexture;if(r.__depthDisposeCallback&&r.__depthDisposeCallback(),U){const H=()=>{delete r.__boundDepthTexture,delete r.__depthDisposeCallback,U.removeEventListener("dispose",H)};U.addEventListener("dispose",H),r.__depthDisposeCallback=H}r.__boundDepthTexture=U}if(p.depthTexture&&!r.__autoAllocateDepthBuffer)if(b)for(let U=0;U<6;U++)Ie(r.__webglFramebuffer[U],p,U);else{const U=p.texture.mipmaps;U&&U.length>0?Ie(r.__webglFramebuffer[0],p,0):Ie(r.__webglFramebuffer,p,0)}else if(b){r.__webglDepthbuffer=[];for(let U=0;U<6;U++)if(t.bindFramebuffer(e.FRAMEBUFFER,r.__webglFramebuffer[U]),r.__webglDepthbuffer[U]===void 0)r.__webglDepthbuffer[U]=e.createRenderbuffer(),at(r.__webglDepthbuffer[U],p,!1);else{const H=p.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,J=r.__webglDepthbuffer[U];e.bindRenderbuffer(e.RENDERBUFFER,J),e.framebufferRenderbuffer(e.FRAMEBUFFER,H,e.RENDERBUFFER,J)}}else{const U=p.texture.mipmaps;if(U&&U.length>0?t.bindFramebuffer(e.FRAMEBUFFER,r.__webglFramebuffer[0]):t.bindFramebuffer(e.FRAMEBUFFER,r.__webglFramebuffer),r.__webglDepthbuffer===void 0)r.__webglDepthbuffer=e.createRenderbuffer(),at(r.__webglDepthbuffer,p,!1);else{const H=p.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,J=r.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,J),e.framebufferRenderbuffer(e.FRAMEBUFFER,H,e.RENDERBUFFER,J)}}t.bindFramebuffer(e.FRAMEBUFFER,null)}function He(p,r,b){const U=i.get(p);r!==void 0&&Ae(U.__webglFramebuffer,p,p.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),b!==void 0&&ze(p)}function Fe(p){const r=p.texture,b=i.get(p),U=i.get(r);p.addEventListener("dispose",f);const H=p.textures,J=p.isWebGLCubeRenderTarget===!0,ie=H.length>1;if(ie||(U.__webglTexture===void 0&&(U.__webglTexture=e.createTexture()),U.__version=r.version,s.memory.textures++),J){b.__webglFramebuffer=[];for(let W=0;W<6;W++)if(r.mipmaps&&r.mipmaps.length>0){b.__webglFramebuffer[W]=[];for(let Y=0;Y<r.mipmaps.length;Y++)b.__webglFramebuffer[W][Y]=e.createFramebuffer()}else b.__webglFramebuffer[W]=e.createFramebuffer()}else{if(r.mipmaps&&r.mipmaps.length>0){b.__webglFramebuffer=[];for(let W=0;W<r.mipmaps.length;W++)b.__webglFramebuffer[W]=e.createFramebuffer()}else b.__webglFramebuffer=e.createFramebuffer();if(ie)for(let W=0,Y=H.length;W<Y;W++){const ae=i.get(H[W]);ae.__webglTexture===void 0&&(ae.__webglTexture=e.createTexture(),s.memory.textures++)}if(p.samples>0&&lt(p)===!1){b.__webglMultisampledFramebuffer=e.createFramebuffer(),b.__webglColorRenderbuffer=[],t.bindFramebuffer(e.FRAMEBUFFER,b.__webglMultisampledFramebuffer);for(let W=0;W<H.length;W++){const Y=H[W];b.__webglColorRenderbuffer[W]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,b.__webglColorRenderbuffer[W]);const ae=o.convert(Y.format,Y.colorSpace),Ee=o.convert(Y.type),se=m(Y.internalFormat,ae,Ee,Y.normalized,Y.colorSpace,p.isXRRenderTarget===!0),re=et(p);e.renderbufferStorageMultisample(e.RENDERBUFFER,re,se,p.width,p.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+W,e.RENDERBUFFER,b.__webglColorRenderbuffer[W])}e.bindRenderbuffer(e.RENDERBUFFER,null),p.depthBuffer&&(b.__webglDepthRenderbuffer=e.createRenderbuffer(),at(b.__webglDepthRenderbuffer,p,!0)),t.bindFramebuffer(e.FRAMEBUFFER,null)}}if(J){t.bindTexture(e.TEXTURE_CUBE_MAP,U.__webglTexture),Be(e.TEXTURE_CUBE_MAP,r);for(let W=0;W<6;W++)if(r.mipmaps&&r.mipmaps.length>0)for(let Y=0;Y<r.mipmaps.length;Y++)Ae(b.__webglFramebuffer[W][Y],p,r,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+W,Y);else Ae(b.__webglFramebuffer[W],p,r,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+W,0);c(r)&&y(e.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ie){for(let W=0,Y=H.length;W<Y;W++){const ae=H[W],Ee=i.get(ae);let se=e.TEXTURE_2D;(p.isWebGL3DRenderTarget||p.isWebGLArrayRenderTarget)&&(se=p.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),t.bindTexture(se,Ee.__webglTexture),Be(se,ae),Ae(b.__webglFramebuffer,p,ae,e.COLOR_ATTACHMENT0+W,se,0),c(ae)&&y(se)}t.unbindTexture()}else{let W=e.TEXTURE_2D;if((p.isWebGL3DRenderTarget||p.isWebGLArrayRenderTarget)&&(W=p.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),t.bindTexture(W,U.__webglTexture),Be(W,r),r.mipmaps&&r.mipmaps.length>0)for(let Y=0;Y<r.mipmaps.length;Y++)Ae(b.__webglFramebuffer[Y],p,r,e.COLOR_ATTACHMENT0,W,Y);else Ae(b.__webglFramebuffer,p,r,e.COLOR_ATTACHMENT0,W,0);c(r)&&y(W),t.unbindTexture()}p.depthBuffer&&ze(p)}function st(p){const r=p.textures;for(let b=0,U=r.length;b<U;b++){const H=r[b];if(c(H)){const J=I(p),ie=i.get(H).__webglTexture;t.bindTexture(J,ie),y(J),t.unbindTexture()}}}const ct=[],dt=[];function mt(p){if(p.samples>0){if(lt(p)===!1){const r=p.textures,b=p.width,U=p.height;let H=e.COLOR_BUFFER_BIT;const J=p.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,ie=i.get(p),W=r.length>1;if(W)for(let ae=0;ae<r.length;ae++)t.bindFramebuffer(e.FRAMEBUFFER,ie.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+ae,e.RENDERBUFFER,null),t.bindFramebuffer(e.FRAMEBUFFER,ie.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+ae,e.TEXTURE_2D,null,0);t.bindFramebuffer(e.READ_FRAMEBUFFER,ie.__webglMultisampledFramebuffer);const Y=p.texture.mipmaps;Y&&Y.length>0?t.bindFramebuffer(e.DRAW_FRAMEBUFFER,ie.__webglFramebuffer[0]):t.bindFramebuffer(e.DRAW_FRAMEBUFFER,ie.__webglFramebuffer);for(let ae=0;ae<r.length;ae++){if(p.resolveDepthBuffer&&(p.depthBuffer&&(H|=e.DEPTH_BUFFER_BIT),p.stencilBuffer&&p.resolveStencilBuffer&&(H|=e.STENCIL_BUFFER_BIT)),W){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,ie.__webglColorRenderbuffer[ae]);const Ee=i.get(r[ae]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,Ee,0)}e.blitFramebuffer(0,0,b,U,0,0,b,U,H,e.NEAREST),T===!0&&(ct.length=0,dt.length=0,ct.push(e.COLOR_ATTACHMENT0+ae),p.depthBuffer&&p.resolveDepthBuffer===!1&&(ct.push(J),dt.push(J),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,dt)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,ct))}if(t.bindFramebuffer(e.READ_FRAMEBUFFER,null),t.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),W)for(let ae=0;ae<r.length;ae++){t.bindFramebuffer(e.FRAMEBUFFER,ie.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+ae,e.RENDERBUFFER,ie.__webglColorRenderbuffer[ae]);const Ee=i.get(r[ae]).__webglTexture;t.bindFramebuffer(e.FRAMEBUFFER,ie.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+ae,e.TEXTURE_2D,Ee,0)}t.bindFramebuffer(e.DRAW_FRAMEBUFFER,ie.__webglMultisampledFramebuffer)}else if(p.depthBuffer&&p.resolveDepthBuffer===!1&&T){const r=p.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[r])}}}function et(p){return Math.min(a.maxSamples,p.samples)}function lt(p){const r=i.get(p);return p.samples>0&&n.has("WEBGL_multisampled_render_to_texture")===!0&&r.__useRenderToTexture!==!1}function x(p){const r=s.render.frame;G.get(p)!==r&&(G.set(p,r),p.update())}function xt(p,r){const b=p.colorSpace,U=p.format,H=p.type;return p.isCompressedTexture===!0||p.isVideoTexture===!0||b!==Fr&&b!==$t&&(Je.getTransfer(b)===Ze?(U!==Bt||H!==Ct)&&Ve("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):je("WebGLTextures: Unsupported texture color space:",b)),r}function We(p){return typeof HTMLImageElement<"u"&&p instanceof HTMLImageElement?(v.width=p.naturalWidth||p.width,v.height=p.naturalHeight||p.height):typeof VideoFrame<"u"&&p instanceof VideoFrame?(v.width=p.displayWidth,v.height=p.displayHeight):(v.width=p.width,v.height=p.height),v}this.allocateTextureUnit=q,this.resetTextureUnits=j,this.getTextureUnits=K,this.setTextureUnits=k,this.setTexture2D=Z,this.setTexture2DArray=ee,this.setTexture3D=ce,this.setTextureCube=_e,this.rebindTextures=He,this.setupRenderTarget=Fe,this.updateRenderTargetMipmap=st,this.updateMultisampleRenderTarget=mt,this.setupDepthRenderbuffer=ze,this.setupFrameBufferTexture=Ae,this.useMultisampledRTT=lt,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function gd(e,n){function t(i,a=$t){let o;const s=Je.getTransfer(a);if(i===Ct)return e.UNSIGNED_BYTE;if(i===Mr)return e.UNSIGNED_SHORT_4_4_4_4;if(i===Tr)return e.UNSIGNED_SHORT_5_5_5_1;if(i===Yo)return e.UNSIGNED_INT_5_9_9_9_REV;if(i===Ko)return e.UNSIGNED_INT_10F_11F_11F_REV;if(i===$o)return e.BYTE;if(i===Zo)return e.SHORT;if(i===Wn)return e.UNSIGNED_SHORT;if(i===br)return e.INT;if(i===rn)return e.UNSIGNED_INT;if(i===Zt)return e.FLOAT;if(i===Vt)return e.HALF_FLOAT;if(i===jo)return e.ALPHA;if(i===Qo)return e.RGB;if(i===Bt)return e.RGBA;if(i===pn)return e.DEPTH_COMPONENT;if(i===un)return e.DEPTH_STENCIL;if(i===Jo)return e.RED;if(i===xr)return e.RED_INTEGER;if(i===on)return e.RG;if(i===Er)return e.RG_INTEGER;if(i===Sr)return e.RGBA_INTEGER;if(i===Qn||i===Jn||i===ei||i===ti)if(s===Ze)if(o=n.get("WEBGL_compressed_texture_s3tc_srgb"),o!==null){if(i===Qn)return o.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Jn)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===ei)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===ti)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(o=n.get("WEBGL_compressed_texture_s3tc"),o!==null){if(i===Qn)return o.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Jn)return o.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===ei)return o.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===ti)return o.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===zi||i===Xi||i===qi||i===Yi)if(o=n.get("WEBGL_compressed_texture_pvrtc"),o!==null){if(i===zi)return o.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Xi)return o.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===qi)return o.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Yi)return o.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Ki||i===$i||i===Zi||i===ji||i===Qi||i===Si||i===Ji)if(o=n.get("WEBGL_compressed_texture_etc"),o!==null){if(i===Ki||i===$i)return s===Ze?o.COMPRESSED_SRGB8_ETC2:o.COMPRESSED_RGB8_ETC2;if(i===Zi)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:o.COMPRESSED_RGBA8_ETC2_EAC;if(i===ji)return o.COMPRESSED_R11_EAC;if(i===Qi)return o.COMPRESSED_SIGNED_R11_EAC;if(i===Si)return o.COMPRESSED_RG11_EAC;if(i===Ji)return o.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===ea||i===ta||i===na||i===ia||i===aa||i===ra||i===oa||i===sa||i===la||i===ca||i===fa||i===ua||i===da||i===pa)if(o=n.get("WEBGL_compressed_texture_astc"),o!==null){if(i===ea)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:o.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===ta)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:o.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===na)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:o.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===ia)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:o.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===aa)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:o.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===ra)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:o.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===oa)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:o.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===sa)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:o.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===la)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:o.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===ca)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:o.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===fa)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:o.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===ua)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:o.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===da)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:o.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===pa)return s===Ze?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:o.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===ha||i===ma||i===_a)if(o=n.get("EXT_texture_compression_bptc"),o!==null){if(i===ha)return s===Ze?o.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:o.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===ma)return o.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===_a)return o.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===ga||i===va||i===Ei||i===Sa)if(o=n.get("EXT_texture_compression_rgtc"),o!==null){if(i===ga)return o.COMPRESSED_RED_RGTC1_EXT;if(i===va)return o.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Ei)return o.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Sa)return o.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===bn?e.UNSIGNED_INT_24_8:e[i]!==void 0?e[i]:null}return{convert:t}}const vd=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Sd=`
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

}`;class Ed{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(n,t){if(this.texture===null){const i=new Ar(n.texture);(n.depthNear!==t.depthNear||n.depthFar!==t.depthFar)&&(this.depthNear=n.depthNear,this.depthFar=n.depthFar),this.texture=i}}getMesh(n){if(this.texture!==null&&this.mesh===null){const t=n.cameras[0].viewport,i=new kt({vertexShader:vd,fragmentShader:Sd,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Wt(new Pi(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class xd extends uo{constructor(n,t){super();const i=this;let a=null,o=1,s=null,d="local-floor",T=1,v=null,G=null,R=null,h=null,S=null,C=null;const B=typeof XRWebGLBinding<"u",u=new Ed,c={},y=t.getContextAttributes();let I=null,m=null;const A=[],g=[],P=new it;let f=null;const _=new Gn;_.viewport=new ht;const N=new Gn;N.viewport=new ht;const D=[_,N],O=new po;let j=null,K=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(z){let ne=A[z];return ne===void 0&&(ne=new Zn,A[z]=ne),ne.getTargetRaySpace()},this.getControllerGrip=function(z){let ne=A[z];return ne===void 0&&(ne=new Zn,A[z]=ne),ne.getGripSpace()},this.getHand=function(z){let ne=A[z];return ne===void 0&&(ne=new Zn,A[z]=ne),ne.getHandSpace()};function k(z){const ne=g.indexOf(z.inputSource);if(ne===-1)return;const Q=A[ne];Q!==void 0&&(Q.update(z.inputSource,z.frame,v||s),Q.dispatchEvent({type:z.type,data:z.inputSource}))}function q(){a.removeEventListener("select",k),a.removeEventListener("selectstart",k),a.removeEventListener("selectend",k),a.removeEventListener("squeeze",k),a.removeEventListener("squeezestart",k),a.removeEventListener("squeezeend",k),a.removeEventListener("end",q),a.removeEventListener("inputsourceschange",V);for(let z=0;z<A.length;z++){const ne=g[z];ne!==null&&(g[z]=null,A[z].disconnect(ne))}j=null,K=null,u.reset();for(const z in c)delete c[z];n.setRenderTarget(I),S=null,h=null,R=null,a=null,m=null,Be.stop(),i.isPresenting=!1,n.setPixelRatio(f),n.setSize(P.width,P.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(z){o=z,i.isPresenting===!0&&Ve("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(z){d=z,i.isPresenting===!0&&Ve("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return v||s},this.setReferenceSpace=function(z){v=z},this.getBaseLayer=function(){return h!==null?h:S},this.getBinding=function(){return R===null&&B&&(R=new XRWebGLBinding(a,t)),R},this.getFrame=function(){return C},this.getSession=function(){return a},this.setSession=async function(z){if(a=z,a!==null){if(I=n.getRenderTarget(),a.addEventListener("select",k),a.addEventListener("selectstart",k),a.addEventListener("selectend",k),a.addEventListener("squeeze",k),a.addEventListener("squeezestart",k),a.addEventListener("squeezeend",k),a.addEventListener("end",q),a.addEventListener("inputsourceschange",V),y.xrCompatible!==!0&&await t.makeXRCompatible(),f=n.getPixelRatio(),n.getSize(P),B&&"createProjectionLayer"in XRWebGLBinding.prototype){let Q=null,Re=null,Ce=null;y.depth&&(Ce=y.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Q=y.stencil?un:pn,Re=y.stencil?bn:rn);const Ae={colorFormat:t.RGBA8,depthFormat:Ce,scaleFactor:o};R=this.getBinding(),h=R.createProjectionLayer(Ae),a.updateRenderState({layers:[h]}),n.setPixelRatio(1),n.setSize(h.textureWidth,h.textureHeight,!1),m=new wt(h.textureWidth,h.textureHeight,{format:Bt,type:Ct,depthTexture:new An(h.textureWidth,h.textureHeight,Re,void 0,void 0,void 0,void 0,void 0,void 0,Q),stencilBuffer:y.stencil,colorSpace:n.outputColorSpace,samples:y.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1})}else{const Q={antialias:y.antialias,alpha:!0,depth:y.depth,stencil:y.stencil,framebufferScaleFactor:o};S=new XRWebGLLayer(a,t,Q),a.updateRenderState({baseLayer:S}),n.setPixelRatio(1),n.setSize(S.framebufferWidth,S.framebufferHeight,!1),m=new wt(S.framebufferWidth,S.framebufferHeight,{format:Bt,type:Ct,colorSpace:n.outputColorSpace,stencilBuffer:y.stencil,resolveDepthBuffer:S.ignoreDepthValues===!1,resolveStencilBuffer:S.ignoreDepthValues===!1})}m.isXRRenderTarget=!0,this.setFoveation(T),v=null,s=await a.requestReferenceSpace(d),Be.setContext(a),Be.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(a!==null)return a.environmentBlendMode},this.getDepthTexture=function(){return u.getDepthTexture()};function V(z){for(let ne=0;ne<z.removed.length;ne++){const Q=z.removed[ne],Re=g.indexOf(Q);Re>=0&&(g[Re]=null,A[Re].disconnect(Q))}for(let ne=0;ne<z.added.length;ne++){const Q=z.added[ne];let Re=g.indexOf(Q);if(Re===-1){for(let Ae=0;Ae<A.length;Ae++)if(Ae>=g.length){g.push(Q),Re=Ae;break}else if(g[Ae]===null){g[Ae]=Q,Re=Ae;break}if(Re===-1)break}const Ce=A[Re];Ce&&Ce.connect(Q)}}const Z=new ye,ee=new ye;function ce(z,ne,Q){Z.setFromMatrixPosition(ne.matrixWorld),ee.setFromMatrixPosition(Q.matrixWorld);const Re=Z.distanceTo(ee),Ce=ne.projectionMatrix.elements,Ae=Q.projectionMatrix.elements,at=Ce[14]/(Ce[10]-1),Ie=Ce[14]/(Ce[10]+1),ze=(Ce[9]+1)/Ce[5],He=(Ce[9]-1)/Ce[5],Fe=(Ce[8]-1)/Ce[0],st=(Ae[8]+1)/Ae[0],ct=at*Fe,dt=at*st,mt=Re/(-Fe+st),et=mt*-Fe;if(ne.matrixWorld.decompose(z.position,z.quaternion,z.scale),z.translateX(et),z.translateZ(mt),z.matrixWorld.compose(z.position,z.quaternion,z.scale),z.matrixWorldInverse.copy(z.matrixWorld).invert(),Ce[10]===-1)z.projectionMatrix.copy(ne.projectionMatrix),z.projectionMatrixInverse.copy(ne.projectionMatrixInverse);else{const lt=at+mt,x=Ie+mt,xt=ct-et,We=dt+(Re-et),p=ze*Ie/x*lt,r=He*Ie/x*lt;z.projectionMatrix.makePerspective(xt,We,p,r,lt,x),z.projectionMatrixInverse.copy(z.projectionMatrix).invert()}}function _e(z,ne){ne===null?z.matrixWorld.copy(z.matrix):z.matrixWorld.multiplyMatrices(ne.matrixWorld,z.matrix),z.matrixWorldInverse.copy(z.matrixWorld).invert()}this.updateCamera=function(z){if(a===null)return;let ne=z.near,Q=z.far;u.texture!==null&&(u.depthNear>0&&(ne=u.depthNear),u.depthFar>0&&(Q=u.depthFar)),O.near=N.near=_.near=ne,O.far=N.far=_.far=Q,(j!==O.near||K!==O.far)&&(a.updateRenderState({depthNear:O.near,depthFar:O.far}),j=O.near,K=O.far),O.layers.mask=z.layers.mask|6,_.layers.mask=O.layers.mask&-5,N.layers.mask=O.layers.mask&-3;const Re=z.parent,Ce=O.cameras;_e(O,Re);for(let Ae=0;Ae<Ce.length;Ae++)_e(Ce[Ae],Re);Ce.length===2?ce(O,_,N):O.projectionMatrix.copy(_.projectionMatrix),ve(z,O,Re)};function ve(z,ne,Q){Q===null?z.matrix.copy(ne.matrixWorld):(z.matrix.copy(Q.matrixWorld),z.matrix.invert(),z.matrix.multiply(ne.matrixWorld)),z.matrix.decompose(z.position,z.quaternion,z.scale),z.updateMatrixWorld(!0),z.projectionMatrix.copy(ne.projectionMatrix),z.projectionMatrixInverse.copy(ne.projectionMatrixInverse),z.isPerspectiveCamera&&(z.fov=ho*2*Math.atan(1/z.projectionMatrix.elements[5]),z.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(!(h===null&&S===null))return T},this.setFoveation=function(z){T=z,h!==null&&(h.fixedFoveation=z),S!==null&&S.fixedFoveation!==void 0&&(S.fixedFoveation=z)},this.hasDepthSensing=function(){return u.texture!==null},this.getDepthSensingMesh=function(){return u.getMesh(O)},this.getCameraTexture=function(z){return c[z]};let Oe=null;function Qe(z,ne){if(G=ne.getViewerPose(v||s),C=ne,G!==null){const Q=G.views;S!==null&&(n.setRenderTargetFramebuffer(m,S.framebuffer),n.setRenderTarget(m));let Re=!1;Q.length!==O.cameras.length&&(O.cameras.length=0,Re=!0);for(let Ie=0;Ie<Q.length;Ie++){const ze=Q[Ie];let He=null;if(S!==null)He=S.getViewport(ze);else{const st=R.getViewSubImage(h,ze);He=st.viewport,Ie===0&&(n.setRenderTargetTextures(m,st.colorTexture,st.depthStencilTexture),n.setRenderTarget(m))}let Fe=D[Ie];Fe===void 0&&(Fe=new Gn,Fe.layers.enable(Ie),Fe.viewport=new ht,D[Ie]=Fe),Fe.matrix.fromArray(ze.transform.matrix),Fe.matrix.decompose(Fe.position,Fe.quaternion,Fe.scale),Fe.projectionMatrix.fromArray(ze.projectionMatrix),Fe.projectionMatrixInverse.copy(Fe.projectionMatrix).invert(),Fe.viewport.set(He.x,He.y,He.width,He.height),Ie===0&&(O.matrix.copy(Fe.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),Re===!0&&O.cameras.push(Fe)}const Ce=a.enabledFeatures;if(Ce&&Ce.includes("depth-sensing")&&a.depthUsage=="gpu-optimized"&&B){R=i.getBinding();const Ie=R.getDepthInformation(Q[0]);Ie&&Ie.isValid&&Ie.texture&&u.init(Ie,a.renderState)}if(Ce&&Ce.includes("camera-access")&&B){n.state.unbindTexture(),R=i.getBinding();for(let Ie=0;Ie<Q.length;Ie++){const ze=Q[Ie].camera;if(ze){let He=c[ze];He||(He=new Ar,c[ze]=He);const Fe=R.getCameraImage(ze);He.sourceTexture=Fe}}}}for(let Q=0;Q<A.length;Q++){const Re=g[Q],Ce=A[Q];Re!==null&&Ce!==void 0&&Ce.update(Re,ne,v||s)}Oe&&Oe(z,ne),ne.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:ne}),C=null}const Be=new Or;Be.setAnimationLoop(Qe),this.setAnimationLoop=function(z){Oe=z},this.dispose=function(){}}}const Md=new an,Xr=new Ne;Xr.set(-1,0,0,0,1,0,0,0,1);function Td(e,n){function t(u,c){u.matrixAutoUpdate===!0&&u.updateMatrix(),c.value.copy(u.matrix)}function i(u,c){c.color.getRGB(u.fogColor.value,Cr(e)),c.isFog?(u.fogNear.value=c.near,u.fogFar.value=c.far):c.isFogExp2&&(u.fogDensity.value=c.density)}function a(u,c,y,I,m){c.isNodeMaterial?c.uniformsNeedUpdate=!1:c.isMeshBasicMaterial?o(u,c):c.isMeshLambertMaterial?(o(u,c),c.envMap&&(u.envMapIntensity.value=c.envMapIntensity)):c.isMeshToonMaterial?(o(u,c),R(u,c)):c.isMeshPhongMaterial?(o(u,c),G(u,c),c.envMap&&(u.envMapIntensity.value=c.envMapIntensity)):c.isMeshStandardMaterial?(o(u,c),h(u,c),c.isMeshPhysicalMaterial&&S(u,c,m)):c.isMeshMatcapMaterial?(o(u,c),C(u,c)):c.isMeshDepthMaterial?o(u,c):c.isMeshDistanceMaterial?(o(u,c),B(u,c)):c.isMeshNormalMaterial?o(u,c):c.isLineBasicMaterial?(s(u,c),c.isLineDashedMaterial&&d(u,c)):c.isPointsMaterial?T(u,c,y,I):c.isSpriteMaterial?v(u,c):c.isShadowMaterial?(u.color.value.copy(c.color),u.opacity.value=c.opacity):c.isShaderMaterial&&(c.uniformsNeedUpdate=!1)}function o(u,c){u.opacity.value=c.opacity,c.color&&u.diffuse.value.copy(c.color),c.emissive&&u.emissive.value.copy(c.emissive).multiplyScalar(c.emissiveIntensity),c.map&&(u.map.value=c.map,t(c.map,u.mapTransform)),c.alphaMap&&(u.alphaMap.value=c.alphaMap,t(c.alphaMap,u.alphaMapTransform)),c.bumpMap&&(u.bumpMap.value=c.bumpMap,t(c.bumpMap,u.bumpMapTransform),u.bumpScale.value=c.bumpScale,c.side===bt&&(u.bumpScale.value*=-1)),c.normalMap&&(u.normalMap.value=c.normalMap,t(c.normalMap,u.normalMapTransform),u.normalScale.value.copy(c.normalScale),c.side===bt&&u.normalScale.value.negate()),c.displacementMap&&(u.displacementMap.value=c.displacementMap,t(c.displacementMap,u.displacementMapTransform),u.displacementScale.value=c.displacementScale,u.displacementBias.value=c.displacementBias),c.emissiveMap&&(u.emissiveMap.value=c.emissiveMap,t(c.emissiveMap,u.emissiveMapTransform)),c.specularMap&&(u.specularMap.value=c.specularMap,t(c.specularMap,u.specularMapTransform)),c.alphaTest>0&&(u.alphaTest.value=c.alphaTest);const y=n.get(c),I=y.envMap,m=y.envMapRotation;I&&(u.envMap.value=I,u.envMapRotation.value.setFromMatrix4(Md.makeRotationFromEuler(m)).transpose(),I.isCubeTexture&&I.isRenderTargetTexture===!1&&u.envMapRotation.value.premultiply(Xr),u.reflectivity.value=c.reflectivity,u.ior.value=c.ior,u.refractionRatio.value=c.refractionRatio),c.lightMap&&(u.lightMap.value=c.lightMap,u.lightMapIntensity.value=c.lightMapIntensity,t(c.lightMap,u.lightMapTransform)),c.aoMap&&(u.aoMap.value=c.aoMap,u.aoMapIntensity.value=c.aoMapIntensity,t(c.aoMap,u.aoMapTransform))}function s(u,c){u.diffuse.value.copy(c.color),u.opacity.value=c.opacity,c.map&&(u.map.value=c.map,t(c.map,u.mapTransform))}function d(u,c){u.dashSize.value=c.dashSize,u.totalSize.value=c.dashSize+c.gapSize,u.scale.value=c.scale}function T(u,c,y,I){u.diffuse.value.copy(c.color),u.opacity.value=c.opacity,u.size.value=c.size*y,u.scale.value=I*.5,c.map&&(u.map.value=c.map,t(c.map,u.uvTransform)),c.alphaMap&&(u.alphaMap.value=c.alphaMap,t(c.alphaMap,u.alphaMapTransform)),c.alphaTest>0&&(u.alphaTest.value=c.alphaTest)}function v(u,c){u.diffuse.value.copy(c.color),u.opacity.value=c.opacity,u.rotation.value=c.rotation,c.map&&(u.map.value=c.map,t(c.map,u.mapTransform)),c.alphaMap&&(u.alphaMap.value=c.alphaMap,t(c.alphaMap,u.alphaMapTransform)),c.alphaTest>0&&(u.alphaTest.value=c.alphaTest)}function G(u,c){u.specular.value.copy(c.specular),u.shininess.value=Math.max(c.shininess,1e-4)}function R(u,c){c.gradientMap&&(u.gradientMap.value=c.gradientMap)}function h(u,c){u.metalness.value=c.metalness,c.metalnessMap&&(u.metalnessMap.value=c.metalnessMap,t(c.metalnessMap,u.metalnessMapTransform)),u.roughness.value=c.roughness,c.roughnessMap&&(u.roughnessMap.value=c.roughnessMap,t(c.roughnessMap,u.roughnessMapTransform)),c.envMap&&(u.envMapIntensity.value=c.envMapIntensity)}function S(u,c,y){u.ior.value=c.ior,c.sheen>0&&(u.sheenColor.value.copy(c.sheenColor).multiplyScalar(c.sheen),u.sheenRoughness.value=c.sheenRoughness,c.sheenColorMap&&(u.sheenColorMap.value=c.sheenColorMap,t(c.sheenColorMap,u.sheenColorMapTransform)),c.sheenRoughnessMap&&(u.sheenRoughnessMap.value=c.sheenRoughnessMap,t(c.sheenRoughnessMap,u.sheenRoughnessMapTransform))),c.clearcoat>0&&(u.clearcoat.value=c.clearcoat,u.clearcoatRoughness.value=c.clearcoatRoughness,c.clearcoatMap&&(u.clearcoatMap.value=c.clearcoatMap,t(c.clearcoatMap,u.clearcoatMapTransform)),c.clearcoatRoughnessMap&&(u.clearcoatRoughnessMap.value=c.clearcoatRoughnessMap,t(c.clearcoatRoughnessMap,u.clearcoatRoughnessMapTransform)),c.clearcoatNormalMap&&(u.clearcoatNormalMap.value=c.clearcoatNormalMap,t(c.clearcoatNormalMap,u.clearcoatNormalMapTransform),u.clearcoatNormalScale.value.copy(c.clearcoatNormalScale),c.side===bt&&u.clearcoatNormalScale.value.negate())),c.dispersion>0&&(u.dispersion.value=c.dispersion),c.iridescence>0&&(u.iridescence.value=c.iridescence,u.iridescenceIOR.value=c.iridescenceIOR,u.iridescenceThicknessMinimum.value=c.iridescenceThicknessRange[0],u.iridescenceThicknessMaximum.value=c.iridescenceThicknessRange[1],c.iridescenceMap&&(u.iridescenceMap.value=c.iridescenceMap,t(c.iridescenceMap,u.iridescenceMapTransform)),c.iridescenceThicknessMap&&(u.iridescenceThicknessMap.value=c.iridescenceThicknessMap,t(c.iridescenceThicknessMap,u.iridescenceThicknessMapTransform))),c.transmission>0&&(u.transmission.value=c.transmission,u.transmissionSamplerMap.value=y.texture,u.transmissionSamplerSize.value.set(y.width,y.height),c.transmissionMap&&(u.transmissionMap.value=c.transmissionMap,t(c.transmissionMap,u.transmissionMapTransform)),u.thickness.value=c.thickness,c.thicknessMap&&(u.thicknessMap.value=c.thicknessMap,t(c.thicknessMap,u.thicknessMapTransform)),u.attenuationDistance.value=c.attenuationDistance,u.attenuationColor.value.copy(c.attenuationColor)),c.anisotropy>0&&(u.anisotropyVector.value.set(c.anisotropy*Math.cos(c.anisotropyRotation),c.anisotropy*Math.sin(c.anisotropyRotation)),c.anisotropyMap&&(u.anisotropyMap.value=c.anisotropyMap,t(c.anisotropyMap,u.anisotropyMapTransform))),u.specularIntensity.value=c.specularIntensity,u.specularColor.value.copy(c.specularColor),c.specularColorMap&&(u.specularColorMap.value=c.specularColorMap,t(c.specularColorMap,u.specularColorMapTransform)),c.specularIntensityMap&&(u.specularIntensityMap.value=c.specularIntensityMap,t(c.specularIntensityMap,u.specularIntensityMapTransform))}function C(u,c){c.matcap&&(u.matcap.value=c.matcap)}function B(u,c){const y=n.get(c).light;u.referencePosition.value.setFromMatrixPosition(y.matrixWorld),u.nearDistance.value=y.shadow.camera.near,u.farDistance.value=y.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:a}}function Ad(e,n,t,i){let a={},o={},s=[];const d=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function T(m,A){const g=A.program;i.uniformBlockBinding(m,g)}function v(m,A){let g=a[m.id];g===void 0&&(u(m),g=G(m),a[m.id]=g,m.addEventListener("dispose",y));const P=A.program;i.updateUBOMapping(m,P);const f=n.render.frame;o[m.id]!==f&&(h(m),o[m.id]=f)}function G(m){const A=R();m.__bindingPointIndex=A;const g=e.createBuffer(),P=m.__size,f=m.usage;return e.bindBuffer(e.UNIFORM_BUFFER,g),e.bufferData(e.UNIFORM_BUFFER,P,f),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,A,g),g}function R(){for(let m=0;m<d;m++)if(s.indexOf(m)===-1)return s.push(m),m;return je("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(m){const A=a[m.id],g=m.uniforms,P=m.__cache;e.bindBuffer(e.UNIFORM_BUFFER,A);for(let f=0,_=g.length;f<_;f++){const N=g[f];if(Array.isArray(N))for(let D=0,O=N.length;D<O;D++)S(N[D],f,D,P);else S(N,f,0,P)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function S(m,A,g,P){if(B(m,A,g,P)===!0){const f=m.__offset,_=m.value;if(Array.isArray(_)){let N=0;for(let D=0;D<_.length;D++){const O=_[D],j=c(O);C(O,m.__data,N),typeof O!="number"&&typeof O!="boolean"&&!O.isMatrix3&&!ArrayBuffer.isView(O)&&(N+=j.storage/Float32Array.BYTES_PER_ELEMENT)}}else C(_,m.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,f,m.__data)}}function C(m,A,g){typeof m=="number"||typeof m=="boolean"?A[0]=m:m.isMatrix3?(A[0]=m.elements[0],A[1]=m.elements[1],A[2]=m.elements[2],A[3]=0,A[4]=m.elements[3],A[5]=m.elements[4],A[6]=m.elements[5],A[7]=0,A[8]=m.elements[6],A[9]=m.elements[7],A[10]=m.elements[8],A[11]=0):ArrayBuffer.isView(m)?A.set(new m.constructor(m.buffer,m.byteOffset,A.length)):m.toArray(A,g)}function B(m,A,g,P){const f=m.value,_=A+"_"+g;if(P[_]===void 0)return typeof f=="number"||typeof f=="boolean"?P[_]=f:ArrayBuffer.isView(f)?P[_]=f.slice():P[_]=f.clone(),!0;{const N=P[_];if(typeof f=="number"||typeof f=="boolean"){if(N!==f)return P[_]=f,!0}else{if(ArrayBuffer.isView(f))return!0;if(N.equals(f)===!1)return N.copy(f),!0}}return!1}function u(m){const A=m.uniforms;let g=0;const P=16;for(let _=0,N=A.length;_<N;_++){const D=Array.isArray(A[_])?A[_]:[A[_]];for(let O=0,j=D.length;O<j;O++){const K=D[O],k=Array.isArray(K.value)?K.value:[K.value];for(let q=0,V=k.length;q<V;q++){const Z=k[q],ee=c(Z),ce=g%P,_e=ce%ee.boundary,ve=ce+_e;g+=_e,ve!==0&&P-ve<ee.storage&&(g+=P-ve),K.__data=new Float32Array(ee.storage/Float32Array.BYTES_PER_ELEMENT),K.__offset=g,g+=ee.storage}}}const f=g%P;return f>0&&(g+=P-f),m.__size=g,m.__cache={},this}function c(m){const A={boundary:0,storage:0};return typeof m=="number"||typeof m=="boolean"?(A.boundary=4,A.storage=4):m.isVector2?(A.boundary=8,A.storage=8):m.isVector3||m.isColor?(A.boundary=16,A.storage=12):m.isVector4?(A.boundary=16,A.storage=16):m.isMatrix3?(A.boundary=48,A.storage=48):m.isMatrix4?(A.boundary=64,A.storage=64):m.isTexture?Ve("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(m)?(A.boundary=16,A.storage=m.byteLength):Ve("WebGLRenderer: Unsupported uniform value type.",m),A}function y(m){const A=m.target;A.removeEventListener("dispose",y);const g=s.indexOf(A.__bindingPointIndex);s.splice(g,1),e.deleteBuffer(a[A.id]),delete a[A.id],delete o[A.id]}function I(){for(const m in a)e.deleteBuffer(a[m]);s=[],a={},o={}}return{bind:T,update:v,dispose:I}}const bd=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let Nt=null;function Rd(){return Nt===null&&(Nt=new vr(bd,16,16,on,Vt),Nt.name="DFG_LUT",Nt.minFilter=gt,Nt.magFilter=gt,Nt.wrapS=Rn,Nt.wrapT=Rn,Nt.generateMipmaps=!1,Nt.needsUpdate=!0),Nt}class Ah{constructor(n={}){const{canvas:t=oo(),context:i=null,depth:a=!0,stencil:o=!1,alpha:s=!1,antialias:d=!1,premultipliedAlpha:T=!0,preserveDrawingBuffer:v=!1,powerPreference:G="default",failIfMajorPerformanceCaveat:R=!1,reversedDepthBuffer:h=!1,outputBufferType:S=Ct}=n;this.isWebGLRenderer=!0;let C;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");C=i.getContextAttributes().alpha}else C=s;const B=S,u=new Set([Sr,Er,xr]),c=new Set([Ct,rn,Wn,bn,Mr,Tr]),y=new Uint32Array(4),I=new Int32Array(4),m=new ye;let A=null,g=null;const P=[],f=[];let _=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Ht,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const N=this;let D=!1,O=null,j=null,K=null,k=null;this._outputColorSpace=so;let q=0,V=0,Z=null,ee=-1,ce=null;const _e=new ht,ve=new ht;let Oe=null;const Qe=new Ye(0);let Be=0,z=t.width,ne=t.height,Q=1,Re=null,Ce=null;const Ae=new ht(0,0,z,ne),at=new ht(0,0,z,ne);let Ie=!1;const ze=new bi;let He=!1,Fe=!1;const st=new an,ct=new ye,dt=new ht,mt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let et=!1;function lt(){return Z===null?Q:1}let x=i;function xt(l,M){return t.getContext(l,M)}try{const l={alpha:!0,depth:a,stencil:o,antialias:d,premultipliedAlpha:T,preserveDrawingBuffer:v,powerPreference:G,failIfMajorPerformanceCaveat:R};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${lo}`),t.addEventListener("webglcontextlost",tt,!1),t.addEventListener("webglcontextrestored",Ke,!1),t.addEventListener("webglcontextcreationerror",Lt,!1),x===null){const M="webgl2";if(x=xt(M,l),x===null)throw xt(M)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}}catch(l){throw je("WebGLRenderer: "+l.message),l}let We,p,r,b,U,H,J,ie,W,Y,ae,Ee,se,re,Te,be,De,E,te,X,oe,de,$;function Se(){We=new Rf(x),We.init(),oe=new gd(x,We),p=new vf(x,We,n,oe),r=new md(x,We),p.reversedDepthBuffer&&h&&r.buffers.depth.setReversed(!0),j=x.createFramebuffer(),K=x.createFramebuffer(),k=x.createFramebuffer(),b=new Pf(x),U=new td,H=new _d(x,We,r,U,p,oe,b),J=new bf(N),ie=new Us(x),de=new _f(x,ie),W=new Cf(x,ie,b,de),Y=new Lf(x,W,ie,de,b),E=new wf(x,p,H),Te=new Sf(U),ae=new ed(N,J,We,p,de,Te),Ee=new Td(N,U),se=new id,re=new cd(We),De=new mf(N,J,r,Y,C,T),be=new hd(N,Y,p),$=new Ad(x,b,p,r),te=new gf(x,We,b),X=new Df(x,We,b),b.programs=ae.programs,N.capabilities=p,N.extensions=We,N.properties=U,N.renderLists=se,N.shadowMap=be,N.state=r,N.info=b}Se(),B!==Ct&&(_=new yf(B,t.width,t.height,d,a,o));const me=new xd(N,x);this.xr=me,this.getContext=function(){return x},this.getContextAttributes=function(){return x.getContextAttributes()},this.forceContextLoss=function(){const l=We.get("WEBGL_lose_context");l&&l.loseContext()},this.forceContextRestore=function(){const l=We.get("WEBGL_lose_context");l&&l.restoreContext()},this.getPixelRatio=function(){return Q},this.setPixelRatio=function(l){l!==void 0&&(Q=l,this.setSize(z,ne,!1))},this.getSize=function(l){return l.set(z,ne)},this.setSize=function(l,M,F=!0){if(me.isPresenting){Ve("WebGLRenderer: Can't change size while VR device is presenting.");return}z=l,ne=M,t.width=Math.floor(l*Q),t.height=Math.floor(M*Q),F===!0&&(t.style.width=l+"px",t.style.height=M+"px"),_!==null&&_.setSize(t.width,t.height),this.setViewport(0,0,l,M)},this.getDrawingBufferSize=function(l){return l.set(z*Q,ne*Q).floor()},this.setDrawingBufferSize=function(l,M,F){z=l,ne=M,Q=F,t.width=Math.floor(l*F),t.height=Math.floor(M*F),this.setViewport(0,0,l,M)},this.setEffects=function(l){if(B===Ct){je("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(l){for(let M=0;M<l.length;M++)if(l[M].isOutputPass===!0){Ve("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}_.setEffects(l||[])},this.getCurrentViewport=function(l){return l.copy(_e)},this.getViewport=function(l){return l.copy(Ae)},this.setViewport=function(l,M,F,w){l.isVector4?Ae.set(l.x,l.y,l.z,l.w):Ae.set(l,M,F,w),r.viewport(_e.copy(Ae).multiplyScalar(Q).round())},this.getScissor=function(l){return l.copy(at)},this.setScissor=function(l,M,F,w){l.isVector4?at.set(l.x,l.y,l.z,l.w):at.set(l,M,F,w),r.scissor(ve.copy(at).multiplyScalar(Q).round())},this.getScissorTest=function(){return Ie},this.setScissorTest=function(l){r.setScissorTest(Ie=l)},this.setOpaqueSort=function(l){Re=l},this.setTransparentSort=function(l){Ce=l},this.getClearColor=function(l){return l.copy(De.getClearColor())},this.setClearColor=function(){De.setClearColor(...arguments)},this.getClearAlpha=function(){return De.getClearAlpha()},this.setClearAlpha=function(){De.setClearAlpha(...arguments)},this.clear=function(l=!0,M=!0,F=!0){let w=0;if(l){let L=!1;if(Z!==null){const ue=Z.texture.format;L=u.has(ue)}if(L){const ue=Z.texture.type,he=c.has(ue),fe=De.getClearColor(),ge=De.getClearAlpha(),xe=fe.r,Pe=fe.g,Le=fe.b;he?(y[0]=xe,y[1]=Pe,y[2]=Le,y[3]=ge,x.clearBufferuiv(x.COLOR,0,y)):(I[0]=xe,I[1]=Pe,I[2]=Le,I[3]=ge,x.clearBufferiv(x.COLOR,0,I))}else w|=x.COLOR_BUFFER_BIT}M&&(w|=x.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),F&&(w|=x.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),w!==0&&x.clear(w)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(l){l.setRenderer(this),O=l},this.dispose=function(){t.removeEventListener("webglcontextlost",tt,!1),t.removeEventListener("webglcontextrestored",Ke,!1),t.removeEventListener("webglcontextcreationerror",Lt,!1),De.dispose(),se.dispose(),re.dispose(),U.dispose(),J.dispose(),Y.dispose(),de.dispose(),$.dispose(),ae.dispose(),me.dispose(),me.removeEventListener("sessionstart",yi),me.removeEventListener("sessionend",Ii),Qt.stop()};function tt(l){l.preventDefault(),Vi("WebGLRenderer: Context Lost."),D=!0}function Ke(){Vi("WebGLRenderer: Context Restored."),D=!1;const l=b.autoReset,M=be.enabled,F=be.autoUpdate,w=be.needsUpdate,L=be.type;Se(),b.autoReset=l,be.enabled=M,be.autoUpdate=F,be.needsUpdate=w,be.type=L}function Lt(l){je("WebGLRenderer: A WebGL context could not be created. Reason: ",l.statusMessage)}function Ut(l){const M=l.target;M.removeEventListener("dispose",Ut),jr(M)}function jr(l){Qr(l),U.remove(l)}function Qr(l){const M=U.get(l).programs;M!==void 0&&(M.forEach(function(F){ae.releaseProgram(F)}),l.isShaderMaterial&&ae.releaseShaderCache(l))}this.renderBufferDirect=function(l,M,F,w,L,ue){M===null&&(M=mt);const he=L.isMesh&&L.matrixWorld.determinantAffine()<0,fe=to(l,M,F,w,L);r.setMaterial(w,he);let ge=F.index,xe=1;if(w.wireframe===!0){if(ge=W.getWireframeAttribute(F),ge===void 0)return;xe=2}const Pe=F.drawRange,Le=F.attributes.position;let Me=Pe.start*xe,ke=(Pe.start+Pe.count)*xe;ue!==null&&(Me=Math.max(Me,ue.start*xe),ke=Math.min(ke,(ue.start+ue.count)*xe)),ge!==null?(Me=Math.max(Me,0),ke=Math.min(ke,ge.count)):Le!=null&&(Me=Math.max(Me,0),ke=Math.min(ke,Le.count));const rt=ke-Me;if(rt<0||rt===1/0)return;de.setup(L,w,fe,F,ge);let nt,Xe=te;if(ge!==null&&(nt=ie.get(ge),Xe=X,Xe.setIndex(nt)),L.isMesh)w.wireframe===!0?(r.setLineWidth(w.wireframeLinewidth*lt()),Xe.setMode(x.LINES)):Xe.setMode(x.TRIANGLES);else if(L.isLine){let vt=w.linewidth;vt===void 0&&(vt=1),r.setLineWidth(vt*lt()),L.isLineSegments?Xe.setMode(x.LINES):L.isLineLoop?Xe.setMode(x.LINE_LOOP):Xe.setMode(x.LINE_STRIP)}else L.isPoints?Xe.setMode(x.POINTS):L.isSprite&&Xe.setMode(x.TRIANGLES);if(L.isBatchedMesh)if(We.get("WEBGL_multi_draw"))Xe.renderMultiDraw(L._multiDrawStarts,L._multiDrawCounts,L._multiDrawCount);else{const vt=L._multiDrawStarts,pe=L._multiDrawCounts,At=L._multiDrawCount,Ge=ge?ie.get(ge).bytesPerElement:1,Rt=U.get(w).currentProgram.getUniforms();for(let yt=0;yt<At;yt++)Rt.setValue(x,"_gl_DrawID",yt),Xe.render(vt[yt]/Ge,pe[yt])}else if(L.isInstancedMesh)Xe.renderInstances(Me,rt,L.count);else if(F.isInstancedBufferGeometry){const vt=F._maxInstanceCount!==void 0?F._maxInstanceCount:1/0,pe=Math.min(F.instanceCount,vt);Xe.renderInstances(Me,rt,pe)}else Xe.render(Me,rt)};function Ui(l,M,F){l.transparent===!0&&l.side===Ot&&l.forceSinglePass===!1?(l.side=bt,l.needsUpdate=!0,Ln(l,M,F),l.side=Tn,l.needsUpdate=!0,Ln(l,M,F),l.side=Ot):Ln(l,M,F)}this.compile=function(l,M,F=null){F===null&&(F=l),g=re.get(F),g.init(M),f.push(g),F.traverseVisible(function(L){L.isLight&&L.layers.test(M.layers)&&(g.pushLight(L),L.castShadow&&g.pushShadow(L))}),l!==F&&l.traverseVisible(function(L){L.isLight&&L.layers.test(M.layers)&&(g.pushLight(L),L.castShadow&&g.pushShadow(L))}),g.setupLights();const w=new Set;return l.traverse(function(L){if(!(L.isMesh||L.isPoints||L.isLine||L.isSprite))return;const ue=L.material;if(ue)if(Array.isArray(ue))for(let he=0;he<ue.length;he++){const fe=ue[he];Ui(fe,F,L),w.add(fe)}else Ui(ue,F,L),w.add(ue)}),g=f.pop(),w},this.compileAsync=function(l,M,F=null){const w=this.compile(l,M,F);return new Promise(L=>{function ue(){if(w.forEach(function(he){U.get(he).currentProgram.isReady()&&w.delete(he)}),w.size===0){L(l);return}setTimeout(ue,10)}We.get("KHR_parallel_shader_compile")!==null?ue():setTimeout(ue,10)})};let Kn=null;function Jr(l){Kn&&Kn(l)}function yi(){Qt.stop()}function Ii(){Qt.start()}const Qt=new Or;Qt.setAnimationLoop(Jr),typeof self<"u"&&Qt.setContext(self),this.setAnimationLoop=function(l){Kn=l,me.setAnimationLoop(l),l===null?Qt.stop():Qt.start()},me.addEventListener("sessionstart",yi),me.addEventListener("sessionend",Ii),this.render=function(l,M){if(M!==void 0&&M.isCamera!==!0){je("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(D===!0)return;O!==null&&O.renderStart(l,M);const F=me.enabled===!0&&me.isPresenting===!0,w=_!==null&&(Z===null||F)&&_.begin(N,Z);if(l.matrixWorldAutoUpdate===!0&&l.updateMatrixWorld(),M.parent===null&&M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),me.enabled===!0&&me.isPresenting===!0&&(_===null||_.isCompositing()===!1)&&(me.cameraAutoUpdate===!0&&me.updateCamera(M),M=me.getCamera()),l.isScene===!0&&l.onBeforeRender(N,l,M,Z),g=re.get(l,f.length),g.init(M),g.state.textureUnits=H.getTextureUnits(),f.push(g),st.multiplyMatrices(M.projectionMatrix,M.matrixWorldInverse),ze.setFromProjectionMatrix(st,Wi,M.reversedDepth),Fe=this.localClippingEnabled,He=Te.init(this.clippingPlanes,Fe),A=se.get(l,P.length),A.init(),P.push(A),me.enabled===!0&&me.isPresenting===!0){const he=N.xr.getDepthSensingMesh();he!==null&&$n(he,M,-1/0,N.sortObjects)}$n(l,M,0,N.sortObjects),A.finish(),N.sortObjects===!0&&A.sort(Re,Ce,M.reversedDepth),et=me.enabled===!1||me.isPresenting===!1||me.hasDepthSensing()===!1,et&&De.addToRenderList(A,l),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),He===!0&&Te.beginShadows();const L=g.state.shadowsArray;if(be.render(L,l,M),He===!0&&Te.endShadows(),(w&&_.hasRenderPass())===!1){const he=A.opaque,fe=A.transmissive;if(g.setupLights(),M.isArrayCamera){const ge=M.cameras;if(fe.length>0)for(let xe=0,Pe=ge.length;xe<Pe;xe++){const Le=ge[xe];Fi(he,fe,l,Le)}et&&De.render(l);for(let xe=0,Pe=ge.length;xe<Pe;xe++){const Le=ge[xe];Ni(A,l,Le,Le.viewport)}}else fe.length>0&&Fi(he,fe,l,M),et&&De.render(l),Ni(A,l,M)}Z!==null&&V===0&&(H.updateMultisampleRenderTarget(Z),H.updateRenderTargetMipmap(Z)),w&&_.end(N),l.isScene===!0&&l.onAfterRender(N,l,M),de.resetDefaultState(),ee=-1,ce=null,f.pop(),f.length>0?(g=f[f.length-1],H.setTextureUnits(g.state.textureUnits),He===!0&&Te.setGlobalState(N.clippingPlanes,g.state.camera)):g=null,P.pop(),P.length>0?A=P[P.length-1]:A=null,O!==null&&O.renderEnd()};function $n(l,M,F,w){if(l.visible===!1)return;if(l.layers.test(M.layers)){if(l.isGroup)F=l.renderOrder;else if(l.isLOD)l.autoUpdate===!0&&l.update(M);else if(l.isLightProbeGrid)g.pushLightProbeGrid(l);else if(l.isLight)g.pushLight(l),l.castShadow&&g.pushShadow(l);else if(l.isSprite){if(!l.frustumCulled||ze.intersectsSprite(l)){w&&dt.setFromMatrixPosition(l.matrixWorld).applyMatrix4(st);const he=Y.update(l),fe=l.material;fe.visible&&A.push(l,he,fe,F,dt.z,null)}}else if((l.isMesh||l.isLine||l.isPoints)&&(!l.frustumCulled||ze.intersectsObject(l))){const he=Y.update(l),fe=l.material;if(w&&(l.boundingSphere!==void 0?(l.boundingSphere===null&&l.computeBoundingSphere(),dt.copy(l.boundingSphere.center)):(he.boundingSphere===null&&he.computeBoundingSphere(),dt.copy(he.boundingSphere.center)),dt.applyMatrix4(l.matrixWorld).applyMatrix4(st)),Array.isArray(fe)){const ge=he.groups;for(let xe=0,Pe=ge.length;xe<Pe;xe++){const Le=ge[xe],Me=fe[Le.materialIndex];Me&&Me.visible&&A.push(l,he,Me,F,dt.z,Le)}}else fe.visible&&A.push(l,he,fe,F,dt.z,null)}}const ue=l.children;for(let he=0,fe=ue.length;he<fe;he++)$n(ue[he],M,F,w)}function Ni(l,M,F,w){const{opaque:L,transmissive:ue,transparent:he}=l;g.setupLightsView(F),He===!0&&Te.setGlobalState(N.clippingPlanes,F),w&&r.viewport(_e.copy(w)),L.length>0&&wn(L,M,F),ue.length>0&&wn(ue,M,F),he.length>0&&wn(he,M,F),r.buffers.depth.setTest(!0),r.buffers.depth.setMask(!0),r.buffers.color.setMask(!0),r.setPolygonOffset(!1)}function Fi(l,M,F,w){if((F.isScene===!0?F.overrideMaterial:null)!==null)return;if(g.state.transmissionRenderTarget[w.id]===void 0){const Me=We.has("EXT_color_buffer_half_float")||We.has("EXT_color_buffer_float");g.state.transmissionRenderTarget[w.id]=new wt(1,1,{generateMipmaps:!0,type:Me?Vt:Ct,minFilter:fn,samples:Math.max(4,p.samples),stencilBuffer:o,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Je.workingColorSpace})}const ue=g.state.transmissionRenderTarget[w.id],he=w.viewport||_e;ue.setSize(he.z*N.transmissionResolutionScale,he.w*N.transmissionResolutionScale);const fe=N.getRenderTarget(),ge=N.getActiveCubeFace(),xe=N.getActiveMipmapLevel();N.setRenderTarget(ue),N.getClearColor(Qe),Be=N.getClearAlpha(),Be<1&&N.setClearColor(16777215,.5),N.clear(),et&&De.render(F);const Pe=N.toneMapping;N.toneMapping=Ht;const Le=w.viewport;if(w.viewport!==void 0&&(w.viewport=void 0),g.setupLightsView(w),He===!0&&Te.setGlobalState(N.clippingPlanes,w),wn(l,F,w),H.updateMultisampleRenderTarget(ue),H.updateRenderTargetMipmap(ue),We.has("WEBGL_multisampled_render_to_texture")===!1){let Me=!1;for(let ke=0,rt=M.length;ke<rt;ke++){const nt=M[ke],{object:Xe,geometry:vt,material:pe,group:At}=nt;if(pe.side===Ot&&Xe.layers.test(w.layers)){const Ge=pe.side;pe.side=bt,pe.needsUpdate=!0,Gi(Xe,F,w,vt,pe,At),pe.side=Ge,pe.needsUpdate=!0,Me=!0}}Me===!0&&(H.updateMultisampleRenderTarget(ue),H.updateRenderTargetMipmap(ue))}N.setRenderTarget(fe,ge,xe),N.setClearColor(Qe,Be),Le!==void 0&&(w.viewport=Le),N.toneMapping=Pe}function wn(l,M,F){const w=M.isScene===!0?M.overrideMaterial:null;for(let L=0,ue=l.length;L<ue;L++){const he=l[L],{object:fe,geometry:ge,group:xe}=he;let Pe=he.material;Pe.allowOverride===!0&&w!==null&&(Pe=w),fe.layers.test(F.layers)&&Gi(fe,M,F,ge,Pe,xe)}}function Gi(l,M,F,w,L,ue){l.onBeforeRender(N,M,F,w,L,ue),l.modelViewMatrix.multiplyMatrices(F.matrixWorldInverse,l.matrixWorld),l.normalMatrix.getNormalMatrix(l.modelViewMatrix),L.onBeforeRender(N,M,F,w,l,ue),L.transparent===!0&&L.side===Ot&&L.forceSinglePass===!1?(L.side=bt,L.needsUpdate=!0,N.renderBufferDirect(F,M,w,L,l,ue),L.side=Tn,L.needsUpdate=!0,N.renderBufferDirect(F,M,w,L,l,ue),L.side=Ot):N.renderBufferDirect(F,M,w,L,l,ue),l.onAfterRender(N,M,F,w,L,ue)}function Ln(l,M,F){M.isScene!==!0&&(M=mt);const w=U.get(l),L=g.state.lights,ue=g.state.shadowsArray,he=L.state.version,fe=ae.getParameters(l,L.state,ue,M,F,g.state.lightProbeGridArray),ge=ae.getProgramCacheKey(fe);let xe=w.programs;w.environment=l.isMeshStandardMaterial||l.isMeshLambertMaterial||l.isMeshPhongMaterial?M.environment:null,w.fog=M.fog;const Pe=l.isMeshStandardMaterial||l.isMeshLambertMaterial&&!l.envMap||l.isMeshPhongMaterial&&!l.envMap;w.envMap=J.get(l.envMap||w.environment,Pe),w.envMapRotation=w.environment!==null&&l.envMap===null?M.environmentRotation:l.envMapRotation,xe===void 0&&(l.addEventListener("dispose",Ut),xe=new Map,w.programs=xe);let Le=xe.get(ge);if(Le!==void 0){if(w.currentProgram===Le&&w.lightsStateVersion===he)return Bi(l,fe),Le}else fe.uniforms=ae.getUniforms(l),O!==null&&l.isNodeMaterial&&O.build(l,F,fe),l.onBeforeCompile(fe,N),Le=ae.acquireProgram(fe,ge),xe.set(ge,Le),w.uniforms=fe.uniforms;const Me=w.uniforms;return(!l.isShaderMaterial&&!l.isRawShaderMaterial||l.clipping===!0)&&(Me.clippingPlanes=Te.uniform),Bi(l,fe),w.needsLights=io(l),w.lightsStateVersion=he,w.needsLights&&(Me.ambientLightColor.value=L.state.ambient,Me.lightProbe.value=L.state.probe,Me.directionalLights.value=L.state.directional,Me.directionalLightShadows.value=L.state.directionalShadow,Me.spotLights.value=L.state.spot,Me.spotLightShadows.value=L.state.spotShadow,Me.rectAreaLights.value=L.state.rectArea,Me.ltc_1.value=L.state.rectAreaLTC1,Me.ltc_2.value=L.state.rectAreaLTC2,Me.pointLights.value=L.state.point,Me.pointLightShadows.value=L.state.pointShadow,Me.hemisphereLights.value=L.state.hemi,Me.directionalShadowMatrix.value=L.state.directionalShadowMatrix,Me.spotLightMatrix.value=L.state.spotLightMatrix,Me.spotLightMap.value=L.state.spotLightMap,Me.pointShadowMatrix.value=L.state.pointShadowMatrix),w.lightProbeGrid=g.state.lightProbeGridArray.length>0,w.currentProgram=Le,w.uniformsList=null,Le}function Oi(l){if(l.uniformsList===null){const M=l.currentProgram.getUniforms();l.uniformsList=Vn.seqWithValue(M.seq,l.uniforms)}return l.uniformsList}function Bi(l,M){const F=U.get(l);F.outputColorSpace=M.outputColorSpace,F.batching=M.batching,F.batchingColor=M.batchingColor,F.instancing=M.instancing,F.instancingColor=M.instancingColor,F.instancingMorph=M.instancingMorph,F.skinning=M.skinning,F.morphTargets=M.morphTargets,F.morphNormals=M.morphNormals,F.morphColors=M.morphColors,F.morphTargetsCount=M.morphTargetsCount,F.numClippingPlanes=M.numClippingPlanes,F.numIntersection=M.numClipIntersection,F.vertexAlphas=M.vertexAlphas,F.vertexTangents=M.vertexTangents,F.toneMapping=M.toneMapping}function eo(l,M){if(l.length===0)return null;if(l.length===1)return l[0].texture!==null?l[0]:null;m.setFromMatrixPosition(M.matrixWorld);for(let F=0,w=l.length;F<w;F++){const L=l[F];if(L.texture!==null&&L.boundingBox.containsPoint(m))return L}return null}function to(l,M,F,w,L){M.isScene!==!0&&(M=mt),H.resetTextureUnits();const ue=M.fog,he=w.isMeshStandardMaterial||w.isMeshLambertMaterial||w.isMeshPhongMaterial?M.environment:null,fe=Z===null?N.outputColorSpace:Z.isXRRenderTarget===!0?Z.texture.colorSpace:Je.workingColorSpace,ge=w.isMeshStandardMaterial||w.isMeshLambertMaterial&&!w.envMap||w.isMeshPhongMaterial&&!w.envMap,xe=J.get(w.envMap||he,ge),Pe=w.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,Le=!!F.attributes.tangent&&(!!w.normalMap||w.anisotropy>0),Me=!!F.morphAttributes.position,ke=!!F.morphAttributes.normal,rt=!!F.morphAttributes.color;let nt=Ht;w.toneMapped&&(Z===null||Z.isXRRenderTarget===!0)&&(nt=N.toneMapping);const Xe=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,vt=Xe!==void 0?Xe.length:0,pe=U.get(w),At=g.state.lights;if(He===!0&&(Fe===!0||l!==ce)){const $e=l===ce&&w.id===ee;Te.setState(w,l,$e)}let Ge=!1;w.version===pe.__version?(pe.needsLights&&pe.lightsStateVersion!==At.state.version||pe.outputColorSpace!==fe||L.isBatchedMesh&&pe.batching===!1||!L.isBatchedMesh&&pe.batching===!0||L.isBatchedMesh&&pe.batchingColor===!0&&L.colorTexture===null||L.isBatchedMesh&&pe.batchingColor===!1&&L.colorTexture!==null||L.isInstancedMesh&&pe.instancing===!1||!L.isInstancedMesh&&pe.instancing===!0||L.isSkinnedMesh&&pe.skinning===!1||!L.isSkinnedMesh&&pe.skinning===!0||L.isInstancedMesh&&pe.instancingColor===!0&&L.instanceColor===null||L.isInstancedMesh&&pe.instancingColor===!1&&L.instanceColor!==null||L.isInstancedMesh&&pe.instancingMorph===!0&&L.morphTexture===null||L.isInstancedMesh&&pe.instancingMorph===!1&&L.morphTexture!==null||pe.envMap!==xe||w.fog===!0&&pe.fog!==ue||pe.numClippingPlanes!==void 0&&(pe.numClippingPlanes!==Te.numPlanes||pe.numIntersection!==Te.numIntersection)||pe.vertexAlphas!==Pe||pe.vertexTangents!==Le||pe.morphTargets!==Me||pe.morphNormals!==ke||pe.morphColors!==rt||pe.toneMapping!==nt||pe.morphTargetsCount!==vt||!!pe.lightProbeGrid!=g.state.lightProbeGridArray.length>0)&&(Ge=!0):(Ge=!0,pe.__version=w.version);let Rt=pe.currentProgram;Ge===!0&&(Rt=Ln(w,M,L),O&&w.isNodeMaterial&&O.onUpdateProgram(w,Rt,pe));let yt=!1,Xt=!1,sn=!1;const qe=Rt.getUniforms(),ot=pe.uniforms;if(r.useProgram(Rt.program)&&(yt=!0,Xt=!0,sn=!0),w.id!==ee&&(ee=w.id,Xt=!0),pe.needsLights){const $e=eo(g.state.lightProbeGridArray,L);pe.lightProbeGrid!==$e&&(pe.lightProbeGrid=$e,Xt=!0)}if(yt||ce!==l){r.buffers.depth.getReversed()&&l.reversedDepth!==!0&&(l._reversedDepth=!0,l.updateProjectionMatrix()),qe.setValue(x,"projectionMatrix",l.projectionMatrix),qe.setValue(x,"viewMatrix",l.matrixWorldInverse);const Yt=qe.map.cameraPosition;Yt!==void 0&&Yt.setValue(x,ct.setFromMatrixPosition(l.matrixWorld)),p.logarithmicDepthBuffer&&qe.setValue(x,"logDepthBufFC",2/(Math.log(l.far+1)/Math.LN2)),(w.isMeshPhongMaterial||w.isMeshToonMaterial||w.isMeshLambertMaterial||w.isMeshBasicMaterial||w.isMeshStandardMaterial||w.isShaderMaterial)&&qe.setValue(x,"isOrthographic",l.isOrthographicCamera===!0),ce!==l&&(ce=l,Xt=!0,sn=!0)}if(pe.needsLights&&(At.state.directionalShadowMap.length>0&&qe.setValue(x,"directionalShadowMap",At.state.directionalShadowMap,H),At.state.spotShadowMap.length>0&&qe.setValue(x,"spotShadowMap",At.state.spotShadowMap,H),At.state.pointShadowMap.length>0&&qe.setValue(x,"pointShadowMap",At.state.pointShadowMap,H)),L.isSkinnedMesh){qe.setOptional(x,L,"bindMatrix"),qe.setOptional(x,L,"bindMatrixInverse");const $e=L.skeleton;$e&&($e.boneTexture===null&&$e.computeBoneTexture(),qe.setValue(x,"boneTexture",$e.boneTexture,H))}L.isBatchedMesh&&(qe.setOptional(x,L,"batchingTexture"),qe.setValue(x,"batchingTexture",L._matricesTexture,H),qe.setOptional(x,L,"batchingIdTexture"),qe.setValue(x,"batchingIdTexture",L._indirectTexture,H),qe.setOptional(x,L,"batchingColorTexture"),L._colorsTexture!==null&&qe.setValue(x,"batchingColorTexture",L._colorsTexture,H));const qt=F.morphAttributes;if((qt.position!==void 0||qt.normal!==void 0||qt.color!==void 0)&&E.update(L,F,Rt),(Xt||pe.receiveShadow!==L.receiveShadow)&&(pe.receiveShadow=L.receiveShadow,qe.setValue(x,"receiveShadow",L.receiveShadow)),(w.isMeshStandardMaterial||w.isMeshLambertMaterial||w.isMeshPhongMaterial)&&w.envMap===null&&M.environment!==null&&(ot.envMapIntensity.value=M.environmentIntensity),ot.dfgLUT!==void 0&&(ot.dfgLUT.value=Rd()),Xt){if(qe.setValue(x,"toneMappingExposure",N.toneMappingExposure),pe.needsLights&&no(ot,sn),ue&&w.fog===!0&&Ee.refreshFogUniforms(ot,ue),Ee.refreshMaterialUniforms(ot,w,Q,ne,g.state.transmissionRenderTarget[l.id]),pe.needsLights&&pe.lightProbeGrid){const $e=pe.lightProbeGrid;ot.probesSH.value=$e.texture,ot.probesMin.value.copy($e.boundingBox.min),ot.probesMax.value.copy($e.boundingBox.max),ot.probesResolution.value.copy($e.resolution)}Vn.upload(x,Oi(pe),ot,H)}if(w.isShaderMaterial&&w.uniformsNeedUpdate===!0&&(Vn.upload(x,Oi(pe),ot,H),w.uniformsNeedUpdate=!1),w.isSpriteMaterial&&qe.setValue(x,"center",L.center),qe.setValue(x,"modelViewMatrix",L.modelViewMatrix),qe.setValue(x,"normalMatrix",L.normalMatrix),qe.setValue(x,"modelMatrix",L.matrixWorld),w.uniformsGroups!==void 0){const $e=w.uniformsGroups;for(let Yt=0,ln=$e.length;Yt<ln;Yt++){const Hi=$e[Yt];$.update(Hi,Rt),$.bind(Hi,Rt)}}return Rt}function no(l,M){l.ambientLightColor.needsUpdate=M,l.lightProbe.needsUpdate=M,l.directionalLights.needsUpdate=M,l.directionalLightShadows.needsUpdate=M,l.pointLights.needsUpdate=M,l.pointLightShadows.needsUpdate=M,l.spotLights.needsUpdate=M,l.spotLightShadows.needsUpdate=M,l.rectAreaLights.needsUpdate=M,l.hemisphereLights.needsUpdate=M}function io(l){return l.isMeshLambertMaterial||l.isMeshToonMaterial||l.isMeshPhongMaterial||l.isMeshStandardMaterial||l.isShadowMaterial||l.isShaderMaterial&&l.lights===!0}this.getActiveCubeFace=function(){return q},this.getActiveMipmapLevel=function(){return V},this.getRenderTarget=function(){return Z},this.setRenderTargetTextures=function(l,M,F){const w=U.get(l);w.__autoAllocateDepthBuffer=l.resolveDepthBuffer===!1,w.__autoAllocateDepthBuffer===!1&&(w.__useRenderToTexture=!1),U.get(l.texture).__webglTexture=M,U.get(l.depthTexture).__webglTexture=w.__autoAllocateDepthBuffer?void 0:F,w.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(l,M){const F=U.get(l);F.__webglFramebuffer=M,F.__useDefaultFramebuffer=M===void 0},this.setRenderTarget=function(l,M=0,F=0){Z=l,q=M,V=F;let w=null,L=!1,ue=!1;if(l){const fe=U.get(l);if(fe.__useDefaultFramebuffer!==void 0){r.bindFramebuffer(x.FRAMEBUFFER,fe.__webglFramebuffer),_e.copy(l.viewport),ve.copy(l.scissor),Oe=l.scissorTest,r.viewport(_e),r.scissor(ve),r.setScissorTest(Oe),ee=-1;return}else if(fe.__webglFramebuffer===void 0)H.setupRenderTarget(l);else if(fe.__hasExternalTextures)H.rebindTextures(l,U.get(l.texture).__webglTexture,U.get(l.depthTexture).__webglTexture);else if(l.depthBuffer){const Pe=l.depthTexture;if(fe.__boundDepthTexture!==Pe){if(Pe!==null&&U.has(Pe)&&(l.width!==Pe.image.width||l.height!==Pe.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");H.setupDepthRenderbuffer(l)}}const ge=l.texture;(ge.isData3DTexture||ge.isDataArrayTexture||ge.isCompressedArrayTexture)&&(ue=!0);const xe=U.get(l).__webglFramebuffer;l.isWebGLCubeRenderTarget?(Array.isArray(xe[M])?w=xe[M][F]:w=xe[M],L=!0):l.samples>0&&H.useMultisampledRTT(l)===!1?w=U.get(l).__webglMultisampledFramebuffer:Array.isArray(xe)?w=xe[F]:w=xe,_e.copy(l.viewport),ve.copy(l.scissor),Oe=l.scissorTest}else _e.copy(Ae).multiplyScalar(Q).floor(),ve.copy(at).multiplyScalar(Q).floor(),Oe=Ie;if(F!==0&&(w=j),r.bindFramebuffer(x.FRAMEBUFFER,w)&&r.drawBuffers(l,w),r.viewport(_e),r.scissor(ve),r.setScissorTest(Oe),L){const fe=U.get(l.texture);x.framebufferTexture2D(x.FRAMEBUFFER,x.COLOR_ATTACHMENT0,x.TEXTURE_CUBE_MAP_POSITIVE_X+M,fe.__webglTexture,F)}else if(ue){const fe=M;for(let ge=0;ge<l.textures.length;ge++){const xe=U.get(l.textures[ge]);x.framebufferTextureLayer(x.FRAMEBUFFER,x.COLOR_ATTACHMENT0+ge,xe.__webglTexture,F,fe)}}else if(l!==null&&F!==0){const fe=U.get(l.texture);x.framebufferTexture2D(x.FRAMEBUFFER,x.COLOR_ATTACHMENT0,x.TEXTURE_2D,fe.__webglTexture,F)}ee=-1},this.readRenderTargetPixels=function(l,M,F,w,L,ue,he,fe=0){if(!(l&&l.isWebGLRenderTarget)){je("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ge=U.get(l).__webglFramebuffer;if(l.isWebGLCubeRenderTarget&&he!==void 0&&(ge=ge[he]),ge){r.bindFramebuffer(x.FRAMEBUFFER,ge);try{const xe=l.textures[fe],Pe=xe.format,Le=xe.type;if(l.textures.length>1&&x.readBuffer(x.COLOR_ATTACHMENT0+fe),!p.textureFormatReadable(Pe)){je("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!p.textureTypeReadable(Le)){je("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}M>=0&&M<=l.width-w&&F>=0&&F<=l.height-L&&x.readPixels(M,F,w,L,oe.convert(Pe),oe.convert(Le),ue)}finally{const xe=Z!==null?U.get(Z).__webglFramebuffer:null;r.bindFramebuffer(x.FRAMEBUFFER,xe)}}},this.readRenderTargetPixelsAsync=async function(l,M,F,w,L,ue,he,fe=0){if(!(l&&l.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ge=U.get(l).__webglFramebuffer;if(l.isWebGLCubeRenderTarget&&he!==void 0&&(ge=ge[he]),ge)if(M>=0&&M<=l.width-w&&F>=0&&F<=l.height-L){r.bindFramebuffer(x.FRAMEBUFFER,ge);const xe=l.textures[fe],Pe=xe.format,Le=xe.type;if(l.textures.length>1&&x.readBuffer(x.COLOR_ATTACHMENT0+fe),!p.textureFormatReadable(Pe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!p.textureTypeReadable(Le))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Me=x.createBuffer();x.bindBuffer(x.PIXEL_PACK_BUFFER,Me),x.bufferData(x.PIXEL_PACK_BUFFER,ue.byteLength,x.STREAM_READ),x.readPixels(M,F,w,L,oe.convert(Pe),oe.convert(Le),0);const ke=Z!==null?U.get(Z).__webglFramebuffer:null;r.bindFramebuffer(x.FRAMEBUFFER,ke);const rt=x.fenceSync(x.SYNC_GPU_COMMANDS_COMPLETE,0);return x.flush(),await co(x,rt,4),x.bindBuffer(x.PIXEL_PACK_BUFFER,Me),x.getBufferSubData(x.PIXEL_PACK_BUFFER,0,ue),x.deleteBuffer(Me),x.deleteSync(rt),ue}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(l,M=null,F=0){const w=Math.pow(2,-F),L=Math.floor(l.image.width*w),ue=Math.floor(l.image.height*w),he=M!==null?M.x:0,fe=M!==null?M.y:0;H.setTexture2D(l,0),x.copyTexSubImage2D(x.TEXTURE_2D,F,0,0,he,fe,L,ue),r.unbindTexture()},this.copyTextureToTexture=function(l,M,F=null,w=null,L=0,ue=0){let he,fe,ge,xe,Pe,Le,Me,ke,rt;const nt=l.isCompressedTexture?l.mipmaps[ue]:l.image;if(F!==null)he=F.max.x-F.min.x,fe=F.max.y-F.min.y,ge=F.isBox3?F.max.z-F.min.z:1,xe=F.min.x,Pe=F.min.y,Le=F.isBox3?F.min.z:0;else{const ot=Math.pow(2,-L);he=Math.floor(nt.width*ot),fe=Math.floor(nt.height*ot),l.isDataArrayTexture?ge=nt.depth:l.isData3DTexture?ge=Math.floor(nt.depth*ot):ge=1,xe=0,Pe=0,Le=0}w!==null?(Me=w.x,ke=w.y,rt=w.z):(Me=0,ke=0,rt=0);const Xe=oe.convert(M.format),vt=oe.convert(M.type);let pe;M.isData3DTexture?(H.setTexture3D(M,0),pe=x.TEXTURE_3D):M.isDataArrayTexture||M.isCompressedArrayTexture?(H.setTexture2DArray(M,0),pe=x.TEXTURE_2D_ARRAY):(H.setTexture2D(M,0),pe=x.TEXTURE_2D),r.activeTexture(x.TEXTURE0),r.pixelStorei(x.UNPACK_FLIP_Y_WEBGL,M.flipY),r.pixelStorei(x.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),r.pixelStorei(x.UNPACK_ALIGNMENT,M.unpackAlignment);const At=r.getParameter(x.UNPACK_ROW_LENGTH),Ge=r.getParameter(x.UNPACK_IMAGE_HEIGHT),Rt=r.getParameter(x.UNPACK_SKIP_PIXELS),yt=r.getParameter(x.UNPACK_SKIP_ROWS),Xt=r.getParameter(x.UNPACK_SKIP_IMAGES);r.pixelStorei(x.UNPACK_ROW_LENGTH,nt.width),r.pixelStorei(x.UNPACK_IMAGE_HEIGHT,nt.height),r.pixelStorei(x.UNPACK_SKIP_PIXELS,xe),r.pixelStorei(x.UNPACK_SKIP_ROWS,Pe),r.pixelStorei(x.UNPACK_SKIP_IMAGES,Le);const sn=l.isDataArrayTexture||l.isData3DTexture,qe=M.isDataArrayTexture||M.isData3DTexture;if(l.isDepthTexture){const ot=U.get(l),qt=U.get(M),$e=U.get(ot.__renderTarget),Yt=U.get(qt.__renderTarget);r.bindFramebuffer(x.READ_FRAMEBUFFER,$e.__webglFramebuffer),r.bindFramebuffer(x.DRAW_FRAMEBUFFER,Yt.__webglFramebuffer);for(let ln=0;ln<ge;ln++)sn&&(x.framebufferTextureLayer(x.READ_FRAMEBUFFER,x.COLOR_ATTACHMENT0,U.get(l).__webglTexture,L,Le+ln),x.framebufferTextureLayer(x.DRAW_FRAMEBUFFER,x.COLOR_ATTACHMENT0,U.get(M).__webglTexture,ue,rt+ln)),x.blitFramebuffer(xe,Pe,he,fe,Me,ke,he,fe,x.DEPTH_BUFFER_BIT,x.NEAREST);r.bindFramebuffer(x.READ_FRAMEBUFFER,null),r.bindFramebuffer(x.DRAW_FRAMEBUFFER,null)}else if(L!==0||l.isRenderTargetTexture||U.has(l)){const ot=U.get(l),qt=U.get(M);r.bindFramebuffer(x.READ_FRAMEBUFFER,K),r.bindFramebuffer(x.DRAW_FRAMEBUFFER,k);for(let $e=0;$e<ge;$e++)sn?x.framebufferTextureLayer(x.READ_FRAMEBUFFER,x.COLOR_ATTACHMENT0,ot.__webglTexture,L,Le+$e):x.framebufferTexture2D(x.READ_FRAMEBUFFER,x.COLOR_ATTACHMENT0,x.TEXTURE_2D,ot.__webglTexture,L),qe?x.framebufferTextureLayer(x.DRAW_FRAMEBUFFER,x.COLOR_ATTACHMENT0,qt.__webglTexture,ue,rt+$e):x.framebufferTexture2D(x.DRAW_FRAMEBUFFER,x.COLOR_ATTACHMENT0,x.TEXTURE_2D,qt.__webglTexture,ue),L!==0?x.blitFramebuffer(xe,Pe,he,fe,Me,ke,he,fe,x.COLOR_BUFFER_BIT,x.NEAREST):qe?x.copyTexSubImage3D(pe,ue,Me,ke,rt+$e,xe,Pe,he,fe):x.copyTexSubImage2D(pe,ue,Me,ke,xe,Pe,he,fe);r.bindFramebuffer(x.READ_FRAMEBUFFER,null),r.bindFramebuffer(x.DRAW_FRAMEBUFFER,null)}else qe?l.isDataTexture||l.isData3DTexture?x.texSubImage3D(pe,ue,Me,ke,rt,he,fe,ge,Xe,vt,nt.data):M.isCompressedArrayTexture?x.compressedTexSubImage3D(pe,ue,Me,ke,rt,he,fe,ge,Xe,nt.data):x.texSubImage3D(pe,ue,Me,ke,rt,he,fe,ge,Xe,vt,nt):l.isDataTexture?x.texSubImage2D(x.TEXTURE_2D,ue,Me,ke,he,fe,Xe,vt,nt.data):l.isCompressedTexture?x.compressedTexSubImage2D(x.TEXTURE_2D,ue,Me,ke,nt.width,nt.height,Xe,nt.data):x.texSubImage2D(x.TEXTURE_2D,ue,Me,ke,he,fe,Xe,vt,nt);r.pixelStorei(x.UNPACK_ROW_LENGTH,At),r.pixelStorei(x.UNPACK_IMAGE_HEIGHT,Ge),r.pixelStorei(x.UNPACK_SKIP_PIXELS,Rt),r.pixelStorei(x.UNPACK_SKIP_ROWS,yt),r.pixelStorei(x.UNPACK_SKIP_IMAGES,Xt),ue===0&&M.generateMipmaps&&x.generateMipmap(pe),r.unbindTexture()},this.initRenderTarget=function(l){U.get(l).__webglFramebuffer===void 0&&H.setupRenderTarget(l)},this.initTexture=function(l){l.isCubeTexture?H.setTextureCube(l,0):l.isData3DTexture?H.setTexture3D(l,0):l.isDataArrayTexture||l.isCompressedArrayTexture?H.setTexture2DArray(l,0):H.setTexture2D(l,0),r.unbindTexture()},this.resetState=function(){q=0,V=0,Z=null,r.reset(),de.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Wi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(n){this._outputColorSpace=n;const t=this.getContext();t.drawingBufferColorSpace=Je._getDrawingBufferColorSpace(n),t.unpackColorSpace=Je._getUnpackColorSpace()}}const Cd=2,Za=2048,ja=4,Dd=/^#[0-9a-fA-F]{6}$/,Qa=1e5,Ja=64,er=5e6;function Pd(e){if(e.instanceCount>Qa)throw new Error(`instanceCount must not exceed ${Qa}.`);if(e.geometry.variantCount>Ja)throw new Error(`variantCount must not exceed ${Ja}.`);if(e.geometry.variantCount>e.instanceCount)throw new Error("variantCount must not exceed instanceCount.");if(e.instanceCount*e.geometry.bladesPerClump*e.geometry.bladeSegments>er)throw new Error(`Configured near-grass workload must not exceed ${er}.`);if(e.geometry.bladesPerClump<3)throw new Error("bladesPerClump must be at least 3.");if(e.geometry.bladeSegments<2)throw new Error("bladeSegments must be at least 2.");if(e.geometry.midBladesPerClump<2)throw new Error("midBladesPerClump must be at least 2.");if(e.geometry.midBladeSegments<1)throw new Error("midBladeSegments must be at least 1.");if(e.geometry.midBladesPerClump>e.geometry.bladesPerClump)throw new Error("midBladesPerClump must not exceed bladesPerClump.");if(e.geometry.midBladeSegments>=e.geometry.bladeSegments)throw new Error("midBladeSegments must be lower than bladeSegments.");if(e.geometry.bladeHeightMin>e.geometry.bladeHeightMax)throw new Error("bladeHeightMin must be less than or equal to bladeHeightMax.");if(e.geometry.bladeWidthMin>e.geometry.bladeWidthMax)throw new Error("bladeWidthMin must be less than or equal to bladeWidthMax.");if(e.geometry.bladeLeanMin>e.geometry.bladeLeanMax)throw new Error("bladeLeanMin must be less than or equal to bladeLeanMax.");if(e.distribution.densityMin>e.distribution.densityMax)throw new Error("densityMin must be less than or equal to densityMax.");if(e.lod.nearMaxDistance>=e.lod.midMaxDistance||e.lod.midMaxDistance>=e.lod.farMaxDistance)throw new Error("Grass LOD distances must increase from near to far.");if(e.lod.transitionDistance>=e.lod.nearMaxDistance)throw new Error("transitionDistance must be lower than nearMaxDistance.");if(e.lod.hysteresisDistance>=e.lod.nearMaxDistance-e.lod.transitionDistance)throw new Error("hysteresisDistance is too large for the near LOD band.");if(Math.hypot(e.wind.directionX,e.wind.directionZ)<Number.EPSILON)throw new Error("Grass wind direction must not be zero.");for(const[t,i]of[["baseColor",e.material.baseColor],["tipColor",e.material.tipColor],["dryColor",e.material.dryColor]])if(!Dd.test(i))throw new Error(`Grass config value ${t} must be a six-digit hex color.`);if(e.impostor.viewsPerAxis<2)throw new Error("impostorViewsPerAxis must be at least 2.");if(e.impostor.viewsPerAxis>16)throw new Error("impostorViewsPerAxis must not exceed 16.");if(e.impostor.frameResolution<32)throw new Error("impostorFrameResolution must be at least 32.");if(e.impostor.padding<ja)throw new Error(`impostorPadding must be at least ${ja} pixels for mip-safe atlas isolation.`);if((e.impostor.frameResolution+e.impostor.padding*2)*e.impostor.viewsPerAxis*Cd>Za)throw new Error(`Impostor atlas size must not exceed ${Za} pixels.`);if(e.impostor.cameraMargin<1)throw new Error("impostorCameraMargin must be at least 1.")}const wd="./config/grass.yaml";function Ld(){return`${wd}?v=${encodeURIComponent("v0.9.6+be7ee296cf04")}`}class bh{async load(n=Ld()){const t=await fetch(n);if(!t.ok)throw new Error(`Unable to load grass config from ${n}: HTTP ${t.status}`);return this.parse(await t.text())}parse(n){const t=Ds.parse(n,"grass"),i=new Ps(t,"Grass"),a={instanceCount:i.number("instanceCount",Kt),patchSize:i.number("patchSize",_t),geometry:{variantCount:i.number("variantCount",Kt),bladesPerClump:i.number("bladesPerClump",Kt),bladeSegments:i.number("bladeSegments",Kt),clumpRadius:i.number("clumpRadius",_t),bladeHeightMin:i.number("bladeHeightMin",_t),bladeHeightMax:i.number("bladeHeightMax",_t),bladeWidthMin:i.number("bladeWidthMin",_t),bladeWidthMax:i.number("bladeWidthMax",_t),bladeLeanMin:i.number("bladeLeanMin",It),bladeLeanMax:i.number("bladeLeanMax",It),bladeCurve:i.number("bladeCurve",{minimum:0,maximum:1.2}),midBladesPerClump:i.number("midBladesPerClump",Kt),midBladeSegments:i.number("midBladeSegments",Kt),midRadiusScale:i.number("midRadiusScale",_t),midHeightScale:i.number("midHeightScale",_t),midWidthScale:i.number("midWidthScale",_t),midLeanScale:i.number("midLeanScale",It)},distribution:{seed:i.number("seed",Ls),rootSink:i.number("rootSink",It),maxSlopeDegrees:i.number("maxSlopeDegrees",{minimum:0,maximum:89}),heightVariation:i.number("heightVariation",{minimum:0,maximum:.95}),widthVariation:i.number("widthVariation",{minimum:0,maximum:.95}),densityMin:i.number("densityMin",{minimum:0,maximum:1}),densityMax:i.number("densityMax",{minimum:0,maximum:1}),densityScale:i.number("densityScale",_t)},wind:{directionX:i.number("windDirectionX"),directionZ:i.number("windDirectionZ"),strength:i.number("windStrength",It),gustScale:i.number("gustScale",_t),gustSpeed:i.number("gustSpeed",It),flutterStrength:i.number("flutterStrength",It),flutterSpeed:i.number("flutterSpeed",It)},material:{baseColor:i.string("baseColor"),tipColor:i.string("tipColor"),dryColor:i.string("dryColor"),rootDarkening:i.number("rootDarkening",{minimum:0,maximum:1}),normalUp:i.number("normalUp",{minimum:0,maximum:1}),ambientBoost:i.number("ambientBoost",{minimum:0,maximum:1}),backlightStrength:i.number("backlightStrength",{minimum:0,maximum:1})},lod:{nearMaxDistance:i.number("nearMaxDistance",_t),midMaxDistance:i.number("midMaxDistance",_t),farMaxDistance:i.number("farMaxDistance",_t),hysteresisDistance:i.number("hysteresisDistance",It),transitionDistance:i.number("transitionDistance",_t)},qa:{warmupSeconds:i.number("qaWarmupSeconds",It),sampleSeconds:i.number("qaSampleSeconds",_t)},impostor:{viewsPerAxis:i.number("impostorViewsPerAxis",Kt),frameResolution:i.number("impostorFrameResolution",Kt),padding:i.number("impostorPadding",ws),cameraMargin:i.number("impostorCameraMargin",_t)}};return t.assertFullyConsumed(),Pd(a),Object.freeze({...a,geometry:Object.freeze(a.geometry),distribution:Object.freeze(a.distribution),wind:Object.freeze(a.wind),material:Object.freeze(a.material),lod:Object.freeze(a.lod),qa:Object.freeze(a.qa),impostor:Object.freeze(a.impostor)})}}class Ud{constructor(n){Ue(this,"state");this.state=n>>>0}next(){this.state=this.state+1831565813>>>0;let n=this.state;return n=Math.imul(n^n>>>15,n|1),n^=n+Math.imul(n^n>>>7,n|61),((n^n>>>14)>>>0)/4294967296}range(n,t){return n+(t-n)*this.next()}}const yd=Math.PI*2,tr=2654435769,Id=1e-4;function nr(e,n,t){const i=Pt.clamp(t,0,1);if(!(n>Id))return{y:e*i,z:0};const a=n*i,o=e/n;return{y:o*Math.sin(a),z:o*(1-Math.cos(a))}}class Rh{createLodVariants(n,t){const i={bladesPerClump:n.midBladesPerClump,bladeSegments:n.midBladeSegments,clumpRadius:n.clumpRadius*n.midRadiusScale,bladeHeightMin:n.bladeHeightMin*n.midHeightScale,bladeHeightMax:n.bladeHeightMax*n.midHeightScale,bladeWidthMin:n.bladeWidthMin*n.midWidthScale,bladeWidthMax:n.bladeWidthMax*n.midWidthScale,bladeLeanMin:n.bladeLeanMin*n.midLeanScale,bladeLeanMax:n.bladeLeanMax*n.midLeanScale,bladeCurve:n.bladeCurve};return{near:this.createVariants(n,n.variantCount,t),mid:this.createVariants(i,n.variantCount,t^tr)}}createInstancedGeometry(n,t,i,a,o){var v,G;const s=new bs;n.index&&s.setIndex(n.index);for(const[R,h]of Object.entries(n.attributes))s.setAttribute(R,h);s.setAttribute("instanceVariation",(a==null?void 0:a.variation)??new ai(t,4));const d=t.length/4,T=i??new Float32Array(d).fill(1);return s.setAttribute("instanceCoverage",(a==null?void 0:a.coverage)??new ai(T,1)),s.setAttribute("instanceBiome",(a==null?void 0:a.biome)??new ai(o??new Float32Array(d),1)),s.boundingBox=((v=n.boundingBox)==null?void 0:v.clone())??null,s.boundingSphere=((G=n.boundingSphere)==null?void 0:G.clone())??null,s}disposeInstancedMesh(n,t=!1){const i=n.geometry;for(const a of Object.keys(i.attributes))(t||a!=="instanceVariation"&&a!=="instanceCoverage"&&a!=="instanceBiome")&&i.deleteAttribute(a);i.setIndex(null),i.dispose(),t||n.dispose()}createVariants(n,t,i){return Array.from({length:t},(a,o)=>this.createClump(n,i+o*tr))}createClump(n,t){const i=new Ud(t),a=[],o=[],s=[],d=[],T=[],v=[];for(let R=0;R<n.bladesPerClump;R+=1){const h=i.range(0,yd),S=Math.sqrt(i.next())*n.clumpRadius,C=Math.cos(h)*S,B=Math.sin(h)*S,u=h+i.range(-.85,.85),c=Math.cos(u)*.5,y=Math.sin(u)*.5,I=-Math.sin(u),m=Math.cos(u),A=h+i.range(-.65,.65),g=i.range(n.bladeLeanMin,n.bladeLeanMax),P=Math.cos(A)*g,f=Math.sin(A)*g,_=i.range(n.bladeHeightMin,n.bladeHeightMax),N=i.range(n.bladeWidthMin,n.bladeWidthMax),D=i.next(),O=i.next(),j=a.length/3;for(let ee=0;ee<n.bladeSegments;ee+=1){const ce=ee/n.bladeSegments,_e=ce*ce*(3-2*ce),ve=Math.pow(1-ce,.72),Oe=N*ve,Qe=nr(_,n.bladeCurve,ce),Be=C+P*_e+I*Qe.z,z=B+f*_e+m*Qe.z;a.push(Be-c*Oe,Qe.y,z-y*Oe,Be+c*Oe,Qe.y,z+y*Oe),o.push(0,ce,1,ce),s.push(ce,ce),d.push(D,D),T.push(O,O)}const K=nr(_,n.bladeCurve,1),k=C+P+I*K.z,q=B+f+m*K.z,V=a.length/3;a.push(k,K.y,q),o.push(.5,1),s.push(1),d.push(D),T.push(O);for(let ee=0;ee<n.bladeSegments-1;ee+=1){const ce=j+ee*2;v.push(ce,ce+2,ce+1,ce+2,ce+3,ce+1)}const Z=j+(n.bladeSegments-1)*2;v.push(Z,V,Z+1)}const G=new Pn;return G.setAttribute("position",new Jt(a,3)),G.setAttribute("uv",new Jt(o,2)),G.setAttribute("grassProgress",new Jt(s,1)),G.setAttribute("grassPhase",new Jt(d,1)),G.setAttribute("grassBladeShade",new Jt(T,1)),G.setIndex(v),G.computeVertexNormals(),G.computeBoundingBox(),G.computeBoundingSphere(),G}}const Nd=0,Ch=1.12,Dh=1.1,Ph=1.2,wh=.35,ir=.12,Lh=.08,Uh=.15;var St=(e=>(e[e.Near=0]="Near",e[e.Mid=1]="Mid",e[e.Far=2]="Far",e[e.Terrain=3]="Terrain",e))(St||{});class yh{constructor(n){Ue(this,"patches",new Map);this.patchSize=n}keyFor(n){return this.key(Math.floor(n.x/this.patchSize),Math.floor(n.z/this.patchSize))}coordinatesFor(n){return[Math.floor(n.x/this.patchSize),Math.floor(n.z/this.patchSize)]}register(n){if(this.patches.has(n.id))throw new Error(`Grass patch ${n.id} is already registered.`);this.patches.set(n.id,n)}values(){return this.patches.values()}clear(){this.patches.clear()}key(n,t){return`${n}:${t}`}}const ui=.001,Fd=1/1024,ar=3;function Gd(e,n){let t=0,i=e.length;for(;t<i;){const a=t+i>>>1;e[a]>n?t=a+1:i=a}return t}class Ih{constructor(n){Ue(this,"cameraPosition",new ye);Ue(this,"closestPoint",new ye);Ue(this,"projectionViewMatrix",new an);Ue(this,"frustum",new bi);Ue(this,"midFalloff",{start:0,end:1,floor:1,scale:1});Ue(this,"submittedMidVertices",0);Ue(this,"submittedFarInstances",0);this.config=n}setMidDensityFalloff(n){this.midFalloff=n}update(n,t){n.updateMatrixWorld(),n.getWorldPosition(this.cameraPosition),this.projectionViewMatrix.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this.frustum.setFromProjectionMatrix(this.projectionViewMatrix),this.submittedMidVertices=0;const i=this.config.farMaxDistance+this.config.transitionDistance;for(const a of t){if(a.bounds.clampPoint(this.cameraPosition,this.closestPoint),a.distance=this.cameraPosition.distanceTo(this.closestPoint),a.distance>=i){a.inFrustum=!1,a.nearMesh&&(a.nearMesh.visible=!1),a.midMesh.visible=!1,a.farMesh&&(a.farMesh.visible=!1);continue}a.inFrustum=this.frustum.intersectsBox(a.bounds),a.farMesh||a.hasFarImpostor?this.updateThreeStagePatch(a):this.updateLegacyPatch(a)}}updateFarGroups(n){const t=this.config.farMaxDistance+this.config.transitionDistance,i=this.config.midMaxDistance-this.config.transitionDistance;this.submittedFarInstances=0;for(const a of n){if(a.bounds.clampPoint(this.cameraPosition,this.closestPoint),a.distance=this.cameraPosition.distanceTo(this.closestPoint),a.distance>=t){a.inFrustum=!1,a.mesh.visible=!1;continue}if(a.inFrustum=this.frustum.intersectsBox(a.bounds),!a.inFrustum){a.mesh.visible=!1;continue}const o=this.cameraPosition.distanceTo(a.boundingSphere.center)+a.boundingSphere.radius;a.mesh.visible=o>i,a.mesh.visible&&(this.submittedFarInstances+=a.mesh.count)}}getSubmittedMidVertices(){return this.submittedMidVertices}getSubmittedFarInstances(){return this.submittedFarInstances}updateThreeStagePatch(n){n.lod=this.resolveLevel(n.distance,n.lod,!0),n.nearCoverage=this.resolveNearCoverage(n.distance);const t=this.resolveFarEntry(n.distance);if(n.midCoverage=Math.max(0,(1-n.nearCoverage)*(1-t)),n.farCoverage=this.resolveFarCoverage(n.distance,n.nearCoverage,t),!n.inFrustum){n.nearMesh&&(n.nearMesh.visible=!1),n.midMesh.visible=!1,n.farMesh&&(n.farMesh.visible=!1);return}const i=this.cameraPosition.distanceTo(n.boundingSphere.center)+n.boundingSphere.radius,a=this.config.nearMaxDistance-this.config.transitionDistance,o=this.config.nearMaxDistance+this.config.transitionDistance,s=this.config.midMaxDistance-this.config.transitionDistance,d=this.config.midMaxDistance+this.config.transitionDistance,T=this.config.farMaxDistance+this.config.transitionDistance;n.nearMesh&&(n.nearMesh.visible=n.distance<o),n.midMesh.visible=i>a&&n.distance<d,n.midMesh.visible&&this.trimMidDraw(n,i),n.farMesh&&(n.farMesh.visible=i>s&&n.distance<T)}trimMidDraw(n,t){const i=n.midSortedDithers;if(!i)return;const a=this.resolveNearCoverage(t),o=this.resolveFarEntry(n.distance),s=Math.max(a,o),T=1-this.midFalloff.scale*Pt.lerp(1,this.midFalloff.floor,Pt.smoothstep(n.distance,this.midFalloff.start,this.midFalloff.end))*(1-s)-Fd,v=T<=0?i.length:Gd(i,T);n.midMesh.geometry.setDrawRange(0,v*ar),this.submittedMidVertices+=v*ar*n.midMesh.count}updateLegacyPatch(n){const t=n.nearMesh;if(t){if(n.lod=this.resolveLevel(n.distance,n.lod,!1),n.nearCoverage=this.resolveNearCoverage(n.distance),n.midDistanceFade=this.resolveLegacyMidDistanceFade(n.distance),!n.inFrustum){t.visible=!1,n.midMesh.visible=!1;return}t.visible=n.nearCoverage>ui,n.midMesh.visible=n.nearCoverage<1-ui&&n.midDistanceFade>ui}}resolveLevel(n,t,i){const a=this.config.hysteresisDistance;if(t===St.Near)return n>this.config.nearMaxDistance+a?St.Mid:St.Near;if(t===St.Mid){if(n<this.config.nearMaxDistance-a)return St.Near;const o=i?this.config.midMaxDistance:this.config.farMaxDistance;return n>o+a?i?St.Far:St.Terrain:St.Mid}return t===St.Far&&i?n<this.config.midMaxDistance-a?St.Mid:n>this.config.farMaxDistance+a?St.Terrain:St.Far:n>=this.config.farMaxDistance-a?St.Terrain:i?St.Far:St.Mid}resolveNearCoverage(n){const t=this.config.nearMaxDistance-this.config.transitionDistance,i=this.config.nearMaxDistance+this.config.transitionDistance;return 1-Pt.smoothstep(n,t,i)}resolveFarEntry(n){const t=this.config.midMaxDistance-this.config.transitionDistance,i=this.config.midMaxDistance+this.config.transitionDistance;return Pt.smoothstep(n,t,i)}resolveFarCoverage(n,t,i){const a=this.config.farMaxDistance-this.config.transitionDistance,o=this.config.farMaxDistance+this.config.transitionDistance,s=Pt.smoothstep(n,a,o),d=(1-t)*Nd;return Pt.lerp(d,1,i)*(1-s)}resolveLegacyMidDistanceFade(n){const t=this.config.farMaxDistance-this.config.transitionDistance,i=this.config.farMaxDistance+this.config.transitionDistance;return 1-Pt.smoothstep(n,t,i)}}const Nh="#c2d6b8",Fh="#bfd9f2",Gh="#7d8f5a",Oh="#fff2d8",Bh=2.4,Hh=.55,Vh=.0035,Wh=.0042,Od=1.15,kh="#8ec0e8",zh="#d5e4c8",Xh="#c2d6b8",qh="#fff4d2",Yh=Od,Kh=200,$h=8,Bd=[350,500,220],kn=new ye(...Bd).normalize(),Hd=-kn.x/Math.max(kn.y,.2),Vd=-kn.z/Math.max(kn.y,.2),rr=.001;class Wd{constructor(){Ue(this,"disc",new ht(0,0,0,1));Ue(this,"strengthValue",0)}set(n,t,i,a,o,s){if(!Number.isFinite(n)||!Number.isFinite(t)||!Number.isFinite(i)||!Number.isFinite(a)||!Number.isFinite(o)||!Number.isFinite(s)||a<=0||s<=rr){this.clear();return}const d=Math.max(0,o);this.disc.set(n+Hd*d,t,i+Vd*d,a),this.strengthValue=Math.min(1,s)}clear(){this.strengthValue=0}get strength(){return this.strengthValue}isEnabled(){return this.strengthValue>rr}}const di=new Wd,Mn=4,or={resolution:256,coverage:24,recoveryRate:.5,freshnessRate:1.4},sr=.04,kd=.3,zd=1/30,Xd=1e-6,lr=.1,pi=8,qd=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,Yd=`
precision highp float;

#define MAX_CONTACTS ${Mn}

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
`;class Kd{constructor(){Ue(this,"config",{...or});Ue(this,"inverseCoverage",1/or.coverage);Ue(this,"renderer");Ue(this,"targets");Ue(this,"readTarget",0);Ue(this,"recoveryFloorRatio",sr);Ue(this,"scene",new Rs);Ue(this,"camera",new Ri(-1,1,1,-1,0,1));Ue(this,"center",new it);Ue(this,"previousCenter",new it);Ue(this,"focus",new it);Ue(this,"contacts",new Float32Array(Mn*pi));Ue(this,"contactCount",0);Ue(this,"accumulatedDeltaSeconds",0);Ue(this,"material");Ue(this,"quad");Ue(this,"hasFocus",!1);Ue(this,"enabled",!1)}configure(n){const t={...this.config,...n};if($d(t),this.config=t,this.inverseCoverage=1/this.config.coverage,this.renderer){const i=this.renderer;this.releaseTargets(),this.attach(i)}}attach(n){if(this.targets){if(this.renderer===n)return;this.releaseTargets()}this.renderer=n;const t=[];try{const i=this.targetSize(),a=jd(n);this.recoveryFloorRatio=a===Vt?sr:kd;const o=cr(i,a);t.push(o);const s=cr(i,a);t.push(s),this.targets=[o,s],t.length=0,this.material=new kt({vertexShader:qd,fragmentShader:Yd,depthTest:!1,depthWrite:!1,uniforms:{uPrevious:{value:this.targets[0].texture},uCenter:{value:new it},uPreviousCenter:{value:new it},uCoverage:{value:this.config.coverage},uInitialize:{value:0},uDelta:{value:0},uRecoveryRate:{value:this.config.recoveryRate},uRecoveryFloor:{value:this.config.recoveryRate*this.recoveryFloorRatio},uFreshnessRate:{value:this.config.freshnessRate},uContactCount:{value:0},uContacts:{value:Array.from({length:Mn},()=>new ht)},uContactShapes:{value:Array.from({length:Mn},()=>new ht(0,1,0,0))}}}),this.quad=new Wt(new Pi(2,2),this.material),this.quad.frustumCulled=!1,this.scene.add(this.quad),this.enabled=!0,this.primeTargets()}catch(i){for(const a of t)a.dispose();throw this.releaseTargets(),this.renderer=void 0,i}}setFocus(n,t){!Number.isFinite(n)||!Number.isFinite(t)||(this.focus.set(n,t),this.hasFocus=!0)}submitContact(n,t,i,a,o,s,d,T){if(!Zd(n,t,i,a,o,s,d,T)||a<=0||i<=0||this.contactCount>=Mn)return;const v=this.contactCount*pi;this.contacts[v]=n,this.contacts[v+1]=t,this.contacts[v+2]=i,this.contacts[v+3]=a,this.contacts[v+4]=o,this.contacts[v+5]=s,this.contacts[v+6]=d,this.contacts[v+7]=T,this.contactCount+=1}render(n){const t=this.renderer,i=this.targets,a=this.material;if(!t||!i||!a||!this.enabled||!this.hasFocus){this.resetPendingFrame();return}if(!Number.isFinite(n)||n<=0){this.resetPendingFrame();return}if(this.accumulatedDeltaSeconds=Math.min(lr,this.accumulatedDeltaSeconds+Math.min(n,lr)),this.accumulatedDeltaSeconds+Xd<zd){this.contactCount=0;return}const o=this.accumulatedDeltaSeconds;this.accumulatedDeltaSeconds=0,this.previousCenter.copy(this.center);const s=this.config.coverage/this.targetSize();this.center.set(Math.round(this.focus.x/s)*s,Math.round(this.focus.y/s)*s);const d=a.uniforms;d.uPrevious.value=i[this.readTarget].texture,d.uCenter.value.copy(this.center),d.uPreviousCenter.value.copy(this.previousCenter),d.uCoverage.value=this.config.coverage,d.uDelta.value=o,d.uRecoveryRate.value=this.config.recoveryRate,d.uRecoveryFloor.value=this.config.recoveryRate*this.recoveryFloorRatio,d.uFreshnessRate.value=this.config.freshnessRate,d.uContactCount.value=this.contactCount;const T=d.uContacts.value,v=d.uContactShapes.value;for(let h=0;h<this.contactCount;h+=1){const S=h*pi;T[h].set(this.contacts[S],this.contacts[S+1],this.contacts[S+2],this.contacts[S+3]),v[h].set(this.contacts[S+4],this.contacts[S+5],Pt.clamp(this.contacts[S+6],0,.95),Pt.clamp(this.contacts[S+7],0,1))}this.contactCount=0;const G=1-this.readTarget,R=t.getRenderTarget();try{t.setRenderTarget(i[G]),t.render(this.scene,this.camera),this.readTarget=G}finally{t.setRenderTarget(R)}}isEnabled(){return this.enabled&&this.hasFocus&&this.targets!==void 0}getTexture(){var n;return((n=this.targets)==null?void 0:n[this.readTarget].texture)??null}getCenter(){return this.center}getInverseCoverage(){return this.inverseCoverage}dispose(){this.releaseTargets(),this.renderer=void 0,this.enabled=!1,this.hasFocus=!1,this.resetPendingFrame()}targetSize(){return Math.max(32,Math.round(this.config.resolution))}resetPendingFrame(){this.contactCount=0,this.accumulatedDeltaSeconds=0}releaseTargets(){var n;this.quad&&(this.scene.remove(this.quad),this.quad.geometry.dispose(),this.quad=void 0),(n=this.material)==null||n.dispose(),this.material=void 0;for(const t of this.targets??[])t.dispose();this.targets=void 0,this.readTarget=0,this.enabled=!1}primeTargets(){const n=this.renderer,t=this.targets,i=this.material;if(!n||!t||!i)return;i.uniforms.uInitialize.value=1,i.uniforms.uContactCount.value=0,i.uniforms.uDelta.value=0;const a=n.getRenderTarget();try{for(const o of t)n.setRenderTarget(o),n.render(this.scene,this.camera)}finally{n.setRenderTarget(a),i.uniforms.uInitialize.value=0}}}function $d(e){if(!Number.isInteger(e.resolution)||e.resolution<32)throw new Error("Grass trail resolution must be an integer of at least 32.");for(const[n,t]of[["coverage",e.coverage],["recoveryRate",e.recoveryRate],["freshnessRate",e.freshnessRate]])if(!Number.isFinite(t)||t<=0)throw new Error(`Grass trail ${n} must be a positive finite number.`)}function Zd(...e){return e.every(Number.isFinite)}function jd(e){const n=e.extensions;return n.has("EXT_color_buffer_half_float")||n.has("EXT_color_buffer_float")?Vt:Ct}function cr(e,n){const t=new wt(e,e,{format:Bt,type:n,minFilter:gt,magFilter:gt,wrapS:Rn,wrapT:Rn,depthBuffer:!1,stencilBuffer:!1,generateMipmaps:!1});return t.texture.colorSpace=$t,t}const Nn=new Kd,Qd=1/48,Jd=.06,ep=.085,tp=.55,np=.037,ip=.31,ap=1.7,rp=.72,op=.28;function sp(e){const{target:n,position:t,windDirection:i,time:a,scale:o,speed:s}=e;return`
float ${n} = 0.5 + 0.5 * (
  sin(
    dot(${t}, ${i}) * ${o} -
    ${a} * ${s}
  ) * ${rp.toFixed(2)} +
  sin(
    dot(
      ${t},
      vec2(-${i}.y, ${i}.x)
    ) * ${np.toFixed(3)} +
    ${a} * ${ip.toFixed(2)} +
    ${ap.toFixed(2)}
  ) * ${op.toFixed(2)}
);
`}const Dt=128,hi=4,mi=11;function Fn(e,n,t){let i=Math.imul(e,374761393)^Math.imul(n,668265263)^t;return i=Math.imul(i^i>>>13,1274126177),((i^i>>>16)>>>0)/4294967296}function fr(e,n,t,i){const a=Math.floor(e),o=Math.floor(n),s=e-a,d=n-o,T=s*s*(3-2*s),v=d*d*(3-2*d),G=(a%t+t)%t,R=(o%t+t)%t,h=(G+1)%t,S=(R+1)%t,C=Fn(G,R,i),B=Fn(h,R,i),u=Fn(G,S,i),c=Fn(h,S,i),y=C+(B-C)*T,I=u+(c-u)*T;return y+(I-y)*v}function ur(e){return Math.max(0,Math.min(255,Math.round(e*255)))}function lp(e=1597334677){const n=new Uint8Array(Dt*Dt*2);for(let i=0;i<Dt;i+=1)for(let a=0;a<Dt;a+=1){const o=a/Dt*hi,s=i/Dt*hi,d=fr(o,s,hi,e),T=fr(a/Dt*mi,i/Dt*mi,mi,e^2654435769),v=(d+T*.5)/1.5,G=v*v*(3-2*v),R=(i*Dt+a)*2;n[R]=ur(G),n[R+1]=ur(T)}const t=new vr(n,Dt,Dt,on,Ct);return t.name="grass-wind-noise",t.wrapS=vi,t.wrapT=vi,t.minFilter=gt,t.magFilter=gt,t.generateMipmaps=!1,t.colorSpace=$t,t.needsUpdate=!0,t}let nn;function Zh(){return nn||(nn=lp()),nn}function jh(){nn==null||nn.dispose(),nn=void 0}const cp=.28,fp=1,up=1.7,dp=1.02,pp=.18,hp=.2,mp=.035,_p=.18,gp=.02,vp=.12,Sp=.55,Ep=.82,xp=1.15,Mp=.55,Tt={tipStart:cp,tipEnd:fp,tipLuminanceScale:up,dryLuminanceScale:dp,shadeDrynessPivot:pp,shadeDrynessScale:hp,shadeDrynessMaximum:mp,instanceDrynessBase:_p,instanceDrynessTip:gp,drynessMaximum:vp,rootFadeEnd:Sp,shadeLightMinimum:Ep,shadeLightMaximum:xp,shadowDesaturation:Mp},dn=new ye(.2126,.7152,.0722);function Et(e){if(!Number.isFinite(e))throw new TypeError("Grass palette GLSL values must be finite.");return Number.isInteger(e)?`${e}.0`:String(e)}function _i(e){return e.r*dn.x+e.g*dn.y+e.b*dn.z}function dr(e,n,t,i,a,o){e.set(i),n.set(a),t.set(o);const s=Math.max(_i(e),1e-4);n.multiplyScalar(s*Tt.tipLuminanceScale/Math.max(_i(n),1e-4)),t.multiplyScalar(s*Tt.dryLuminanceScale/Math.max(_i(t),1e-4))}const Tp=.62,Ap=Et(Tp),qr=`
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
    ${Et(Tt.tipStart)},
    ${Et(Tt.tipEnd)},
    progress
  );
  vec3 healthyColor = mix(
    baseColor,
    tipColor,
    tipProfile * tipColorStrength
  );
  float shadeDryness = clamp(
    (${Et(Tt.shadeDrynessPivot)} - shade) *
      ${Et(Tt.shadeDrynessScale)},
    0.0,
    ${Et(Tt.shadeDrynessMaximum)}
  );
  float instanceDryness = dryness * (
    ${Et(Tt.instanceDrynessBase)} +
    tipProfile * ${Et(Tt.instanceDrynessTip)}
  );
  vec3 paletteColor = mix(
    healthyColor,
    dryColor,
    clamp(
      shadeDryness + instanceDryness,
      0.0,
      ${Et(Tt.drynessMaximum)}
    )
  );
  float rootLight = mix(
    rootDarkening,
    1.0,
    smoothstep(0.0, ${Et(Tt.rootFadeEnd)}, progress)
  );
  float bladeVariation = mix(
    ${Et(Tt.shadeLightMinimum)},
    ${Et(Tt.shadeLightMaximum)},
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
      ${Et(dn.x)},
      ${Et(dn.y)},
      ${Et(dn.z)}
    ))),
    clamp(
      (1.0 - occlusion) * ${Et(Tt.shadowDesaturation)},
      0.0,
      1.0
    )
  );
}
`,bp={index:0,label:"Meadow",paletteSource:"art",worldShare:.62,baseColor:"#3f8330",tipColor:"#a9db57",dryColor:"#b3ac5e",rootDarkening:.36,tipColorStrength:.46,density:1,heightBand:[.86,1.14],widthBand:[.86,1.1],drynessBias:0,windDamping:1,shapeFamily:"blade",accentDensity:1,accentSpecies:[{species:"daisy",tint:"white",weight:1.2},{species:"daisy",tint:"cream",weight:.7},{species:"daisy",tint:"sky-blue",weight:.25},{species:"round-bloom",tint:"pink",weight:.35},{species:"round-bloom",tint:"lavender",weight:.25},{species:"round-bloom",tint:"buttercup",weight:.15},{species:"round-bloom",tint:"poppy-red",weight:.1},{species:"fern",tint:"none",weight:2},{species:"small-fern",tint:"none",weight:1},{species:"grass-tuft",tint:"none",weight:4},{species:"sprig",tint:"none",weight:2}]},Rp={index:2,label:"Alpine",paletteSource:"profile",worldShare:.18,baseColor:"#2f6b45",tipColor:"#7fae7a",dryColor:"#8d9573",rootDarkening:.42,tipColorStrength:.42,density:.7,heightBand:[.7,.9],widthBand:[.85,1],drynessBias:.12,windDamping:.8,shapeFamily:"blade",accentDensity:.5,accentSpecies:[{species:"grass-tuft",tint:"none",weight:4},{species:"daisy",tint:"white",weight:.75},{species:"daisy",tint:"cream",weight:.35},{species:"daisy",tint:"sky-blue",weight:.35},{species:"round-bloom",tint:"lavender",weight:.75},{species:"round-bloom",tint:"pink",weight:.35},{species:"small-fern",tint:"none",weight:1}]},Cp={meadow:bp,"dry-steppe":{index:1,label:"Dry Steppe",paletteSource:"profile",worldShare:.2,baseColor:"#7a7a3c",tipColor:"#cbbf6a",dryColor:"#c2a35a",rootDarkening:.44,tipColorStrength:.44,density:.55,heightBand:[.78,1.02],widthBand:[.8,.98],drynessBias:.35,windDamping:.9,shapeFamily:"blade",accentDensity:.6,accentSpecies:[{species:"seed-head",tint:"straw",weight:4},{species:"tall-tuft",tint:"none",weight:3},{species:"grass-tuft",tint:"none",weight:2},{species:"round-bloom",tint:"buttercup",weight:.55},{species:"round-bloom",tint:"cream",weight:.25},{species:"round-bloom",tint:"poppy-red",weight:.1}]},alpine:Rp},Qh=8,Jh=8;function em(e,n){return(e+n)*.5}const Dp=Object.freeze([{key:"grass-tuft",category:"tuft",aspect:.9,windWeight:.85,canopyHeightBand:[.7,.95]},{key:"tall-tuft",category:"tuft",aspect:.6,windWeight:1,canopyHeightBand:[1,1.3]},{key:"fern",category:"fern",aspect:1,windWeight:.35,canopyHeightBand:[.85,1.15]},{key:"small-fern",category:"fern",aspect:.95,windWeight:.4,canopyHeightBand:[.58,.82]},{key:"daisy",category:"flower",aspect:.72,windWeight:.7,canopyHeightBand:[.88,1.58]},{key:"round-bloom",category:"flower",aspect:.9,windWeight:.65,canopyHeightBand:[.82,1.46]},{key:"seed-head",category:"seed",aspect:.5,windWeight:1,canopyHeightBand:[1.3,1.72]},{key:"sprig",category:"tuft",aspect:.7,windWeight:.55,canopyHeightBand:[.7,1]}].map((e,n)=>Object.freeze({...e,index:n}))),Yr=Object.freeze([{key:"white",color:"#ddd8c6"},{key:"cream",color:"#d4c7a3"},{key:"buttercup",color:"#c9ac62"},{key:"poppy-red",color:"#a56a5d"},{key:"pink",color:"#bf939e"},{key:"lavender",color:"#9f96ae"},{key:"straw",color:"#b9ad86"},{key:"sky-blue",color:"#8fa5ad"}]),Dn="none";function Pp(e){return Dp.find(n=>n.key===e)}function tm(e){if(e===Dn)return 0;const n=Yr.findIndex(t=>t.key===e);return n<0?0:n}function nm(e,n,t){return e*16+n*8+t}const mn=8,wp=Object.freeze([{species:"daisy",tint:"white",weight:3},{species:"round-bloom",tint:"poppy-red",weight:1},{species:"fern",tint:Dn,weight:2},{species:"grass-tuft",tint:Dn,weight:4}]),Lp=Object.freeze([.7,1.14]),Up=Object.freeze([.76,1.1]),pr=Object.freeze([.7,1]),im=1,yp=/^#[0-9a-f]{6}$/i;function pt(e){throw new Error(`[grass-biome] ${e}`)}function Ai(e,n){return(typeof e!="object"||e===null||Array.isArray(e))&&pt(`${n} must be an object.`),e}function Ft(e,n,t,i){return(typeof e!="number"||!Number.isFinite(e))&&pt(`${i} must be a finite number.`),(e<n||e>t)&&pt(`${i} must be within [${n}, ${t}], got ${e}.`),e}function hr(e,n,t){(!Array.isArray(e)||e.length!==2)&&pt(`${t} must be a two-element band.`);const i=Ft(e[0],n[0],n[1],`${t} minimum`),a=Ft(e[1],n[0],n[1],`${t} maximum`);return i>a&&pt(`${t} is reversed.`),[i,a]}function Ip(e,n){return e===void 0?wp:((!Array.isArray(e)||e.length===0)&&pt(`${n} must be a non-empty array when present.`),Object.freeze(e.map((t,i)=>{const a=`${n}[${i}]`,o=Ai(t,a);(typeof o.species!="string"||!Pp(o.species))&&pt(`${a} names an unknown accent species.`);const s=o.tint??Dn;return(typeof s!="string"||s!==Dn&&!Yr.some(d=>d.key===s))&&pt(`${a} names an unknown accent tint.`),Object.freeze({species:o.species,tint:s,weight:Ft(o.weight,.01,16,`${a} weight`)})})))}function Np(e,n){const t=n.index;(typeof t!="number"||!Number.isInteger(t)||t<0)&&pt(`Biome ${e} needs a non-negative integer index.`),(typeof n.label!="string"||n.label.length===0)&&pt(`Biome ${e} needs a label.`),n.paletteSource!=="art"&&n.paletteSource!=="profile"&&pt(`Biome ${e} paletteSource must be "art" or "profile".`),t===0&&n.paletteSource!=="art"&&pt("Biome 0 must take the art direction's palette so a single-biome world renders identically to one without biome support.");for(const i of["baseColor","tipColor","dryColor"])(typeof n[i]!="string"||!yp.test(n[i]))&&pt(`Biome ${e} ${i} must be #RRGGBB.`);return(typeof n.shapeFamily!="string"||n.shapeFamily.length===0)&&pt(`Biome ${e} needs a shapeFamily.`),{key:e,index:t,label:n.label,paletteSource:n.paletteSource,baseColor:n.baseColor,tipColor:n.tipColor,dryColor:n.dryColor,rootDarkening:Ft(n.rootDarkening,0,1,`Biome ${e} rootDarkening`),tipColorStrength:Ft(n.tipColorStrength,0,1,`Biome ${e} tipColorStrength`),worldShare:Ft(n.worldShare,.01,1,`Biome ${e} worldShare`),density:Ft(n.density,1e-4,1,`Biome ${e} density`),heightBand:hr(n.heightBand,Lp,`Biome ${e} heightBand`),widthBand:hr(n.widthBand,Up,`Biome ${e} widthBand`),drynessBias:Ft(n.drynessBias,0,.6,`Biome ${e} drynessBias`),windDamping:Ft(n.windDamping,pr[0],pr[1],`Biome ${e} windDamping`),shapeFamily:n.shapeFamily,accentDensity:n.accentDensity===void 0?1:Ft(n.accentDensity,0,1,`Biome ${e} accentDensity`),accentSpecies:Ip(n.accentSpecies,`Biome ${e} accentSpecies`)}}function Fp(){const e=Ai(Cp,"Grass biome profile data"),n=Object.entries(e);n.length===0&&pt("At least one biome profile is required."),n.length>mn&&pt(`At most ${mn} biome profiles fit the bounded palette uniform arrays, found ${n.length}.`);const t=n.map(([a,o])=>Np(a,Ai(o,`Biome ${a}`)));t.sort((a,o)=>a.index-o.index),t.forEach((a,o)=>{a.index!==o&&pt(`Biome indices must be dense from 0; ${a.key} has index ${a.index} at position ${o}.`)});const i=t.reduce((a,o)=>a+o.worldShare,0);return t.length>1&&t[0].worldShare/i<.4&&pt("Biome 0 must hold at least 40% of the world: it carries the art direction's palette, and a world where it is a minority no longer looks like the active preset."),Object.freeze(t.map(a=>Object.freeze(a)))}const Li=Fp();function zn(e){return(e[0]+e[1])*.5}function am(e){return Math.min(1,zn(e.heightBand)/zn(Li[0].heightBand))}function rm(e){return Math.min(1,zn(e.widthBand)/zn(Li[0].widthBand))}const Gp=1.29,Op=12,Bp=.16,Hp=.55,mr=.09,Vp=42,Wp=18,_r=.55,kp=.00107,zp=1.15,Xp=3,gr=.06,Kr=30,$r=64,om=Object.freeze({start:Kr,end:$r,floor:.35}),Zr=`
#define GRASS_MAX_BIOMES ${mn}
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
`,qp=`
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
`,Yp=`
uniform float uGrassPixelWorldScale;
uniform float uGrassMinPixelWidth;
uniform float uGrassBladeHalfWidth;
uniform float uGrassMaxWidenDistance;
`,Kp=`
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
`,$p=`
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
`,Zp=`
bool grassKeepLod = uGrassLodInvert < 0.5
  ? grassDither <= uGrassLodThreshold
  : grassDither > uGrassLodThreshold && grassDither <= uGrassDistanceFade;
`,jp=`
uniform float uGrassLodThreshold;
uniform float uGrassDistanceFade;
`,Qp=`
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
`,Jp=`
varying float vGrassProgress;
varying float vGrassShade;
varying float vGrassDryness;
varying float vGrassRootAo;
flat varying float vGrassBiome;
varying float vGrassGust;
`,eh=`
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
    grassFlutter * uGrassFlutterStrength
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

`,th=`
vGrassSheen = vec2(
  (1.0 - smoothstep(
    uGrassSheenFadeDistance * 0.55,
    uGrassSheenFadeDistance,
    grassCameraDistance
  )) * (0.45 + 0.85 * grassGustNoise),
  mix(0.55, 1.0, grassProgress)
);
`,nh=`
vGrassSheen = vec2(0.0, mix(0.55, 1.0, grassProgress));
`,ih=`
vec2 grassGustUv = grassWorldRoot.xz * uGrassWindNoiseScale -
  uGrassWindDirection * (uGrassTime * uGrassWindNoiseSpeed);
float grassGustNoise = texture2D(uGrassWindNoise, grassGustUv).r;
`,ah=sp({target:"grassGustNoise",position:"grassWorldRoot.xz",windDirection:"uGrassWindDirection",time:"uGrassTime",scale:"uGrassGustFrontScale",speed:"uGrassGustFrontSpeed"}),rh=`
uniform sampler2D uGrassWindNoise;
uniform float uGrassWindNoiseScale;
uniform float uGrassWindNoiseSpeed;
`,oh=`
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
`,sh=`
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
        float grassTrailAngle = clamp(
          uGrassTrailMaxAngle * uGrassTrailStrength * grassTrailResponse * grassTrailWobble,
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
`,lh=`
vGrassProgress = grassProgress;
vGrassShade = grassBladeShade;
vGrassDryness = instanceVariation.w;
vGrassRootAo = instanceVariation.z;
vGrassBiome = instanceBiome;
vGrassGust = grassGustNoise;
`,ch=`
int grassBiomeRow = grassResolveBiomeRow(instanceBiome);
vec3 grassPaletteColor = grassResolvePalette(
  uGrassBiomeBase[grassBiomeRow],
  uGrassBiomeTip[grassBiomeRow],
  uGrassBiomeDry[grassBiomeRow],
  grassProgress,
  grassBladeShade,
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
`,fh=`
${Zr}
uniform vec3 uGrassCanopyColor;
varying vec3 vGrassColor;
${qr}
`,uh=`
${Zr}
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
${qr}
`,dh=`
varying float vGrassGroundShade;
`,ph=`
diffuseColor.rgb *= vGrassGroundShade;
`,hh=`
uniform vec3 uGrassTipColor;
uniform float uGrassAmbientBoost;
uniform float uGrassBacklightStrength;
uniform float uGrassSheenStrength;
uniform float uGrassSheenPower;
varying vec3 vGrassColor;
varying vec2 vGrassSheen;
`,mh=`
#include <color_fragment>
diffuseColor.rgb = vGrassColor;
GRASS_GROUND_SHADE_APPLY
totalEmissiveRadiance += diffuseColor.rgb * uGrassAmbientBoost;
`,_h=`
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
totalEmissiveRadiance += diffuseColor.rgb * uGrassAmbientBoost;
`,gh=`
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
  grassBackLight = grassIntoSun * grassIntoSun * grassThinness * vGrassSheen.y;
GRASS_SHEEN_OUTPUT
#endif
vec3 grassLambertLight =
  reflectedLight.directDiffuse +
  reflectedLight.indirectDiffuse +
  totalEmissiveRadiance;
vec3 outgoingLight =
  mix(diffuseColor.rgb, grassLambertLight, ${Ap}) +
  mix(diffuseColor.rgb, uGrassTipColor, 0.35) *
    grassBackLight * uGrassBacklightStrength +
  grassSheen;
`,vh=`
  // Skip both the half-vector normalization and the high-power lobe once the
  // contribution has faded. This branch is coherent across distant quads.
  if (vGrassSheen.x > 0.001) {
    vec3 grassHalfVector = normalize(grassSunDirection + grassViewDirection);
    grassSheen = directionalLights[0].color * (
      pow(saturate(dot(normal, grassHalfVector)), uGrassSheenPower) *
      uGrassSheenStrength * vGrassSheen.x
    );
  }
`;function gi(e){return Array.from({length:mn},()=>new Ye(e))}function Sh(e,n){return Array.from({length:mn},()=>new it(e,n))}class sm{constructor(n){Ue(this,"material");Ue(this,"colorControls",{baseColor:"#273f22",tipColor:"#83a96b",dryColor:"#a8a06a"});Ue(this,"uniforms",{uGrassTime:{value:0},uGrassWindDirection:{value:new it(.8,.35).normalize()},uGrassWindStrength:{value:.14},uGrassGustScale:{value:.08},uGrassGustSpeed:{value:.65},uGrassFlutterStrength:{value:.035},uGrassFlutterSpeed:{value:3.4},uGrassBiomeBase:{value:gi(this.colorControls.baseColor)},uGrassBiomeTip:{value:gi(this.colorControls.tipColor)},uGrassBiomeDry:{value:gi(this.colorControls.dryColor)},uGrassBiomeShade:{value:Sh(.55,.5)},uGrassTipColor:{value:new Ye(this.colorControls.tipColor)},uGrassNormalUp:{value:.45},uGrassAmbientBoost:{value:.12},uGrassBacklightStrength:{value:.16},uGrassLodInvert:{value:0},uGrassLodThreshold:{value:1},uGrassDistanceFade:{value:1},uGrassDitherSeed:{value:0},uGrassWindLodScale:{value:1},uGrassNearDistance:{value:0},uGrassMidDistance:{value:0},uGrassTransitionDistance:{value:1},uGrassDetailMode:{value:0},uGrassDetailNearDistance:{value:0},uGrassDetailTransitionDistance:{value:1},uGrassArtDensityScale:{value:1},uGrassCanopyColor:{value:new Ye("#4d923f")},uGrassBladeCurvature:{value:Hp},uGrassSheenStrength:{value:mr},uGrassSheenPower:{value:Vp},uGrassSheenFadeDistance:{value:Wp},uGrassGustFrontScale:{value:ep},uGrassGustFrontSpeed:{value:tp},uGrassGustFrontDepth:{value:_r},uGrassGustTipBoost:{value:ir},uGrassWindNoise:{value:null},uGrassWindNoiseScale:{value:Qd},uGrassWindNoiseSpeed:{value:Jd},uGrassDensityFalloffStart:{value:Kr},uGrassDensityFalloffEnd:{value:$r},uGrassDensityFloor:{value:1},uGrassLodDensityScale:{value:1},uGrassPixelWorldScale:{value:kp},uGrassMinPixelWidth:{value:zp},uGrassBladeHalfWidth:{value:.017},uGrassMaxWidenDistance:{value:gr},uGrassTrailMap:{value:null},uGrassTrailCenter:{value:new it},uGrassTrailInverseCoverage:{value:1},uGrassTrailStrength:{value:0},uGrassTrailMaxAngle:{value:Gp},uGrassTrailWobbleFrequency:{value:Op},uGrassTrailWobbleAmplitude:{value:Bp},uGrassGroundShadowDisc:{value:new ht(0,0,0,1)},uGrassGroundShadowStrength:{value:0}});Ue(this,"interactive");Ue(this,"baseWindStrength",.14);Ue(this,"baseFlutterStrength",.035);Ue(this,"artRootDarkening",.55);Ue(this,"artTipColorStrength",.5);this.interactive=n.interactive===!0,this.uniforms.uGrassLodInvert.value=n.invertLodCoverage?1:0,this.uniforms.uGrassWindLodScale.value=n.windLodScale??1,this.uniforms.uGrassDetailMode.value=n.detailMode??0,this.uniforms.uGrassDitherSeed.value=(n.ditherSeed??0)/4294967296,this.setPaletteColors(),this.material=new Cs({side:Ot,color:16777215,transparent:!1,depthWrite:!0}),this.material.name=n.name;const t=n.vertexPalette===!0,i=n.worldLod!==!1,a=n.subPixelWidth===!0,o=n.sheen!==!1,s=n.noiseWind===!0,d=n.instanceFreeDither===!0,T=i?$p:Zp;this.material.onBeforeCompile=v=>{Object.assign(v.uniforms,this.uniforms),v.vertexShader=v.vertexShader.replace("#include <common>",`#include <common>${qp}${this.interactive?Kp:""}${i?"":jp}${a?Yp:""}${s?rh:""}${t?fh:Jp}`).replace("#include <beginnormal_vertex>",`#include <beginnormal_vertex>${Qp}`).replace("#include <begin_vertex>",`#include <begin_vertex>${eh.replace("GRASS_KEEP_LOD",T).replace("GRASS_DITHER_INSTANCE_TERM",d?"":"instanceVariation.x +").replace("GRASS_GUST_NOISE",s?ih:ah).replace("GRASS_SHEEN_VARYING",o?th:nh).replace("GRASS_SUBPIXEL_WIDTH",a?oh:"").replace("GRASS_TRAIL_BEND",this.interactive?sh:"").replace("GRASS_GROUND_SHADE_INIT",this.interactive?"vGrassGroundShade = 1.0;":"")}${t?ch:lh}`),v.fragmentShader=v.fragmentShader.replace("#include <common>",`#include <common>${t?hh:uh}${this.interactive?dh:""}`).replace("#include <color_fragment>",(t?mh:_h).replace("GRASS_GROUND_SHADE_APPLY",this.interactive?ph:"")).replace("vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;",gh.replace("GRASS_SHEEN_OUTPUT",o?vh:""))},this.material.customProgramCacheKey=()=>n.cacheKey}configure(n,t){this.colorControls.baseColor=n.baseColor,this.colorControls.tipColor=n.tipColor,this.colorControls.dryColor=n.dryColor,this.artRootDarkening=n.rootDarkening,this.setPaletteColors(),this.uniforms.uGrassNormalUp.value=n.normalUp,this.uniforms.uGrassAmbientBoost.value=n.ambientBoost,this.uniforms.uGrassBacklightStrength.value=n.backlightStrength,this.uniforms.uGrassWindDirection.value.set(t.directionX,t.directionZ).normalize(),this.baseWindStrength=t.strength,this.baseFlutterStrength=t.flutterStrength,this.uniforms.uGrassWindStrength.value=t.strength,this.uniforms.uGrassGustScale.value=t.gustScale,this.uniforms.uGrassGustSpeed.value=t.gustSpeed,this.uniforms.uGrassFlutterStrength.value=t.flutterStrength,this.uniforms.uGrassFlutterSpeed.value=t.flutterSpeed}applyArtDirection(n){this.colorControls.baseColor=n.baseColor,this.colorControls.tipColor=n.tipColor,this.colorControls.dryColor=n.dryColor,this.artRootDarkening=n.rootDarkening,this.artTipColorStrength=n.tipColorStrength,this.setPaletteColors(),this.uniforms.uGrassNormalUp.value=n.normalUp,this.uniforms.uGrassAmbientBoost.value=n.ambientBoost,this.uniforms.uGrassBacklightStrength.value=n.backlightStrength,this.uniforms.uGrassArtDensityScale.value=n.densityScale,this.uniforms.uGrassWindStrength.value=this.baseWindStrength*n.windStrengthScale,this.uniforms.uGrassFlutterStrength.value=this.baseFlutterStrength*n.flutterStrengthScale,this.configureGust(n.gustDepth??_r,n.gustTipBoost??ir),this.uniforms.uGrassCanopyColor.value.set(n.terrainGrassColor),this.uniforms.uGrassSheenFadeDistance.value=n.nearDistance}setViewportPixelScale(n){Number.isFinite(n)&&n>0&&(this.uniforms.uGrassPixelWorldScale.value=n)}setBladeHalfWidth(n){const t=Math.max(n,1e-4);this.uniforms.uGrassBladeHalfWidth.value=t,this.uniforms.uGrassMaxWidenDistance.value=Math.min(t*Xp,gr)}getDitherSeed(){return this.uniforms.uGrassDitherSeed.value}setLodThreshold(n,t=1){this.uniforms.uGrassLodThreshold.value=n,this.uniforms.uGrassDistanceFade.value=t}configureLod(n){this.uniforms.uGrassNearDistance.value=n.nearMaxDistance,this.uniforms.uGrassMidDistance.value=n.midMaxDistance,this.uniforms.uGrassTransitionDistance.value=n.transitionDistance}configureDetailLod(n){this.uniforms.uGrassDetailNearDistance.value=n.nearMaxDistance,this.uniforms.uGrassDetailTransitionDistance.value=n.transitionDistance}update(n){if(this.uniforms.uGrassTime.value=n,!!this.interactive){if(di.isEnabled()?(this.uniforms.uGrassGroundShadowDisc.value.copy(di.disc),this.uniforms.uGrassGroundShadowStrength.value=di.strength):this.uniforms.uGrassGroundShadowStrength.value=0,!Nn.isEnabled()){this.uniforms.uGrassTrailStrength.value=0;return}this.uniforms.uGrassTrailMap.value=Nn.getTexture(),this.uniforms.uGrassTrailCenter.value.copy(Nn.getCenter()),this.uniforms.uGrassTrailInverseCoverage.value=Nn.getInverseCoverage(),this.uniforms.uGrassTrailStrength.value=1}}configureTrail(n){this.uniforms.uGrassTrailMaxAngle.value=n.maxAngleRadians,this.uniforms.uGrassTrailWobbleFrequency.value=n.wobbleFrequency,this.uniforms.uGrassTrailWobbleAmplitude.value=n.wobbleAmplitude}setPaletteColors(){const n=this.uniforms.uGrassBiomeBase.value,t=this.uniforms.uGrassBiomeTip.value,i=this.uniforms.uGrassBiomeDry.value,a=this.uniforms.uGrassBiomeShade.value;dr(n[0],t[0],i[0],this.colorControls.baseColor,this.colorControls.tipColor,this.colorControls.dryColor),a[0].set(this.artRootDarkening,this.artTipColorStrength),this.uniforms.uGrassTipColor.value.copy(t[0]);for(let o=1;o<mn;o+=1){const s=Li[o];if(!s||s.paletteSource==="art"){n[o].copy(n[0]),t[o].copy(t[0]),i[o].copy(i[0]),a[o].copy(a[0]);continue}dr(n[o],t[o],i[o],s.baseColor,s.tipColor,s.dryColor),a[o].set(s.rootDarkening,s.tipColorStrength)}}setWindNoise(n,t,i){this.uniforms.uGrassWindNoise.value=n,this.uniforms.uGrassWindNoiseScale.value=t,this.uniforms.uGrassWindNoiseSpeed.value=i}configureDensityFalloff(n,t,i){this.uniforms.uGrassDensityFalloffStart.value=n,this.uniforms.uGrassDensityFalloffEnd.value=t,this.uniforms.uGrassDensityFloor.value=i}getDensityFalloff(){return{start:this.uniforms.uGrassDensityFalloffStart.value,end:this.uniforms.uGrassDensityFalloffEnd.value,floor:this.uniforms.uGrassDensityFloor.value}}setLodDensityScale(n){this.uniforms.uGrassLodDensityScale.value=Pt.clamp(n,.05,1)}getLodDensityScale(){return this.uniforms.uGrassLodDensityScale.value}configureGust(n,t){this.uniforms.uGrassGustFrontDepth.value=n,this.uniforms.uGrassGustTipBoost.value=t}setSheenEnabled(n){this.uniforms.uGrassSheenStrength.value=n?mr:0}setupGUI(n,t=[]){const i=[this,...t],a=n.addFolder("Grass Props");a.addColor(this.colorControls,"baseColor").onChange(s=>{for(const d of i)d.colorControls.baseColor=s,d.setPaletteColors()}),a.addColor(this.colorControls,"tipColor").onChange(s=>{for(const d of i)d.colorControls.tipColor=s,d.setPaletteColors()}),a.addColor(this.colorControls,"dryColor").onChange(s=>{for(const d of i)d.colorControls.dryColor=s,d.setPaletteColors()});const o={value:this.artTipColorStrength};a.add(o,"value",.15,.75,.01).name("Tip Mix").onChange(s=>{for(const d of i)d.artTipColorStrength=s,d.setPaletteColors()}),a.add(this.uniforms.uGrassWindStrength,"value",0,.45,.005).name("Wind Strength").onChange(s=>{for(const d of t)d.uniforms.uGrassWindStrength.value=s}),a.add(this.uniforms.uGrassFlutterStrength,"value",0,.15,.0025).name("Tip Flutter").onChange(s=>{for(const d of t)d.uniforms.uGrassFlutterStrength.value=s}),a.add(this.uniforms.uGrassNormalUp,"value",0,.9,.01).name("Normal Up").onChange(s=>{for(const d of t)d.uniforms.uGrassNormalUp.value=s}),a.add(this.uniforms.uGrassAmbientBoost,"value",0,.4,.01).name("Ambient Boost").onChange(s=>{for(const d of t)d.uniforms.uGrassAmbientBoost.value=s}),a.add(this.uniforms.uGrassBacklightStrength,"value",0,.5,.01).name("Backlight").onChange(s=>{for(const d of t)d.uniforms.uGrassBacklightStrength.value=s}),a.add(this.uniforms.uGrassBladeCurvature,"value",0,1.2,.01).name("Blade Curve").onChange(s=>{for(const d of t)d.uniforms.uGrassBladeCurvature.value=s}),a.add(this.uniforms.uGrassSheenStrength,"value",0,.3,.005).name("Sheen").onChange(s=>{for(const d of t)d.uniforms.uGrassSheenStrength.value=s}),a.add(this.uniforms.uGrassSheenPower,"value",8,96,1).name("Sheen Focus").onChange(s=>{for(const d of t)d.uniforms.uGrassSheenPower.value=s}),a.add(this.uniforms.uGrassGustFrontDepth,"value",0,.9,.01).name("Gust Fronts").onChange(s=>{for(const d of t)d.uniforms.uGrassGustFrontDepth.value=s}),a.add(this.uniforms.uGrassGustFrontSpeed,"value",0,1.6,.01).name("Gust Speed").onChange(s=>{for(const d of t)d.uniforms.uGrassGustFrontSpeed.value=s}),a.open()}}const Eh=.1;class lm{constructor(){Ue(this,"elapsedSeconds",0)}update(n){return!Number.isFinite(n)||n<=0?this.elapsedSeconds:(this.elapsedSeconds+=Math.min(n,Eh),this.elapsedSeconds)}}function cm(){const e=Math.max(1,window.innerWidth),n=Math.max(1,window.innerHeight);return{width:e,height:n,aspect:e/n}}function fm(e){const n=window.devicePixelRatio,t=Number.isFinite(n)&&n>0?n:1;return Math.min(t,e)}export{Xh as $,Nd as A,qr as B,Ap as C,sp as D,wh as E,tp as F,bh as G,ep as H,im as I,Dp as J,Yr as K,Jh as L,Qh as M,em as N,nm as O,tm as P,Zh as Q,om as R,Ud as S,am as T,le as U,rm as V,lm as W,jh as X,Yh as Y,Pa as Z,qh as _,Rh as a,zh as a0,Fh as a1,Hh as a2,Oh as a3,Bh as a4,$h as a5,Kh as a6,Nh as a7,Wh as a8,Vh as a9,Od as aa,sm as b,yh as c,Ih as d,St as e,Ah as f,fm as g,kh as h,Gh as i,di as j,Nn as k,Li as l,Bd as m,mn as n,Za as o,Cd as p,Dh as q,cm as r,dr as s,Lh as t,Uh as u,Ph as v,Ch as w,ir as x,Jd as y,Qd as z};
