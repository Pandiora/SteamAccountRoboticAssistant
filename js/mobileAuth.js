// jsSha 1.6 - important version!
"use strict";!function(n){function e(n,e,t){var s=0,l=[0],h="",c=null,h=t||"UTF8";if("UTF8"!==h&&"UTF16BE"!==h&&"UTF16LE"!==h)throw"encoding must be UTF8, UTF16BE, or UTF16LE";if("HEX"===e){if(0!==n.length%2)throw"srcString of HEX type must be in byte increments";c=a(n),s=c.binLen,l=c.value}else if("TEXT"===e||"ASCII"===e)c=r(n,h),s=c.binLen,l=c.value;else if("B64"===e)c=u(n),s=c.binLen,l=c.value;else{if("BYTES"!==e)throw"inputFormat must be HEX, TEXT, ASCII, B64, or BYTES";c=o(n),s=c.binLen,l=c.value}this.getHash=function(n,e,t,r){var a,o=null,u=l.slice(),h=s;if(3===arguments.length?"number"!=typeof t&&(r=t,t=1):2===arguments.length&&(t=1),t!==parseInt(t,10)||1>t)throw"numRounds must a integer >= 1";switch(e){case"HEX":o=i;break;case"B64":o=w;break;case"BYTES":o=f;break;default:throw"format must be HEX, B64, or BYTES"}if("SHA-1"===n)for(a=0;t>a;a+=1)u=x(u,h),h=160;else if("SHA-224"===n)for(a=0;t>a;a+=1)u=P(u,h,n),h=224;else if("SHA-256"===n)for(a=0;t>a;a+=1)u=P(u,h,n),h=256;else if("SHA-384"===n)for(a=0;t>a;a+=1)u=P(u,h,n),h=384;else{if("SHA-512"!==n)throw"Chosen SHA variant is not supported";for(a=0;t>a;a+=1)u=P(u,h,n),h=512}return o(u,b(r))},this.getHMAC=function(n,e,t,c,p){var g,v,S,d,A=[],H=[];switch(g=null,c){case"HEX":c=i;break;case"B64":c=w;break;case"BYTES":c=f;break;default:throw"outputFormat must be HEX, B64, or BYTES"}if("SHA-1"===t)v=64,d=160;else if("SHA-224"===t)v=64,d=224;else if("SHA-256"===t)v=64,d=256;else if("SHA-384"===t)v=128,d=384;else{if("SHA-512"!==t)throw"Chosen SHA variant is not supported";v=128,d=512}if("HEX"===e)g=a(n),S=g.binLen,g=g.value;else if("TEXT"===e||"ASCII"===e)g=r(n,h),S=g.binLen,g=g.value;else if("B64"===e)g=u(n),S=g.binLen,g=g.value;else{if("BYTES"!==e)throw"inputFormat must be HEX, TEXT, ASCII, B64, or BYTES";g=o(n),S=g.binLen,g=g.value}if(n=8*v,e=v/4-1,S/8>v){for(g="SHA-1"===t?x(g,S):P(g,S,t);g.length<=e;)g.push(0);g[e]&=4294967040}else if(v>S/8){for(;g.length<=e;)g.push(0);g[e]&=4294967040}for(v=0;e>=v;v+=1)A[v]=909522486^g[v],H[v]=1549556828^g[v];return t="SHA-1"===t?x(H.concat(x(A.concat(l),n+s)),n+d):P(H.concat(P(A.concat(l),n+s,t)),n+d,t),c(t,b(p))}}function t(n,e){this.a=n,this.b=e}function r(n,e){var t,r,a,o,u=[],i=[],w=0;if("UTF8"===e)for(r=0;r<n.length;r+=1)for(t=n.charCodeAt(r),i=[],128>t?i.push(t):2048>t?(i.push(192|t>>>6),i.push(128|63&t)):55296>t||t>=57344?i.push(224|t>>>12,128|t>>>6&63,128|63&t):(r+=1,t=65536+((1023&t)<<10|1023&n.charCodeAt(r)),i.push(240|t>>>18,128|t>>>12&63,128|t>>>6&63,128|63&t)),a=0;a<i.length;a+=1){for(o=w>>>2;u.length<=o;)u.push(0);u[o]|=i[a]<<24-w%4*8,w+=1}else if("UTF16BE"===e||"UTF16LE"===e)for(r=0;r<n.length;r+=1){for(t=n.charCodeAt(r),"UTF16LE"===e&&(a=255&t,t=a<<8|t>>8),o=w>>>2;u.length<=o;)u.push(0);u[o]|=t<<16-w%4*8,w+=2}return{value:u,binLen:8*w}}function a(n){var e,t,r,a=[],o=n.length;if(0!==o%2)throw"String of HEX type must be in byte increments";for(e=0;o>e;e+=2){if(t=parseInt(n.substr(e,2),16),isNaN(t))throw"String of HEX type contains invalid characters";for(r=e>>>3;a.length<=r;)a.push(0);a[e>>>3]|=t<<24-e%8*4}return{value:a,binLen:4*o}}function o(n){var e,t,r,a=[];for(t=0;t<n.length;t+=1)e=n.charCodeAt(t),r=t>>>2,a.length<=r&&a.push(0),a[r]|=e<<24-t%4*8;return{value:a,binLen:8*n.length}}function u(n){var e,t,r,a,o,u=[],i=0;if(-1===n.search(/^[a-zA-Z0-9=+\/]+$/))throw"Invalid character in base-64 string";if(t=n.indexOf("="),n=n.replace(/\=/g,""),-1!==t&&t<n.length)throw"Invalid '=' found in base-64 string";for(t=0;t<n.length;t+=4){for(o=n.substr(t,4),r=a=0;r<o.length;r+=1)e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(o[r]),a|=e<<18-6*r;for(r=0;r<o.length-1;r+=1){for(e=i>>>2;u.length<=e;)u.push(0);u[e]|=(a>>>16-8*r&255)<<24-i%4*8,i+=1}}return{value:u,binLen:8*i}}function i(n,e){var t,r,a="",o=4*n.length;for(t=0;o>t;t+=1)r=n[t>>>2]>>>8*(3-t%4),a+="0123456789abcdef".charAt(r>>>4&15)+"0123456789abcdef".charAt(15&r);return e.outputUpper?a.toUpperCase():a}function w(n,e){var t,r,a,o="",u=4*n.length;for(t=0;u>t;t+=3)for(a=t+1>>>2,r=n.length<=a?0:n[a],a=t+2>>>2,a=n.length<=a?0:n[a],a=(n[t>>>2]>>>8*(3-t%4)&255)<<16|(r>>>8*(3-(t+1)%4)&255)<<8|a>>>8*(3-(t+2)%4)&255,r=0;4>r;r+=1)o=8*t+6*r<=32*n.length?o+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(a>>>6*(3-r)&63):o+e.b64Pad;return o}function f(n){var e,t,r="",a=4*n.length;for(e=0;a>e;e+=1)t=n[e>>>2]>>>8*(3-e%4)&255,r+=String.fromCharCode(t);return r}function b(n){var e={outputUpper:!1,b64Pad:"="};try{n.hasOwnProperty("outputUpper")&&(e.outputUpper=n.outputUpper),n.hasOwnProperty("b64Pad")&&(e.b64Pad=n.b64Pad)}catch(t){}if("boolean"!=typeof e.outputUpper)throw"Invalid outputUpper formatting option";if("string"!=typeof e.b64Pad)throw"Invalid b64Pad formatting option";return e}function s(n,e){return n<<e|n>>>32-e}function l(n,e){return n>>>e|n<<32-e}function h(n,e){var r=null,r=new t(n.a,n.b);return r=32>=e?new t(r.a>>>e|r.b<<32-e&4294967295,r.b>>>e|r.a<<32-e&4294967295):new t(r.b>>>e-32|r.a<<64-e&4294967295,r.a>>>e-32|r.b<<64-e&4294967295)}function c(n,e){var r=null;return r=32>=e?new t(n.a>>>e,n.b>>>e|n.a<<32-e&4294967295):new t(0,n.a>>>e-32)}function p(n,e,t){return n&e^~n&t}function g(n,e,r){return new t(n.a&e.a^~n.a&r.a,n.b&e.b^~n.b&r.b)}function v(n,e,t){return n&e^n&t^e&t}function S(n,e,r){return new t(n.a&e.a^n.a&r.a^e.a&r.a,n.b&e.b^n.b&r.b^e.b&r.b)}function d(n){return l(n,2)^l(n,13)^l(n,22)}function A(n){var e=h(n,28),r=h(n,34);return n=h(n,39),new t(e.a^r.a^n.a,e.b^r.b^n.b)}function H(n){return l(n,6)^l(n,11)^l(n,25)}function m(n){var e=h(n,14),r=h(n,18);return n=h(n,41),new t(e.a^r.a^n.a,e.b^r.b^n.b)}function E(n){return l(n,7)^l(n,18)^n>>>3}function T(n){var e=h(n,1),r=h(n,8);return n=c(n,7),new t(e.a^r.a^n.a,e.b^r.b^n.b)}function U(n){return l(n,17)^l(n,19)^n>>>10}function B(n){var e=h(n,19),r=h(n,61);return n=c(n,6),new t(e.a^r.a^n.a,e.b^r.b^n.b)}function L(n,e){var t=(65535&n)+(65535&e);return((n>>>16)+(e>>>16)+(t>>>16)&65535)<<16|65535&t}function X(n,e,t,r){var a=(65535&n)+(65535&e)+(65535&t)+(65535&r);return((n>>>16)+(e>>>16)+(t>>>16)+(r>>>16)+(a>>>16)&65535)<<16|65535&a}function y(n,e,t,r,a){var o=(65535&n)+(65535&e)+(65535&t)+(65535&r)+(65535&a);return((n>>>16)+(e>>>16)+(t>>>16)+(r>>>16)+(a>>>16)+(o>>>16)&65535)<<16|65535&o}function C(n,e){var r,a,o;return r=(65535&n.b)+(65535&e.b),a=(n.b>>>16)+(e.b>>>16)+(r>>>16),o=(65535&a)<<16|65535&r,r=(65535&n.a)+(65535&e.a)+(a>>>16),a=(n.a>>>16)+(e.a>>>16)+(r>>>16),new t((65535&a)<<16|65535&r,o)}function F(n,e,r,a){var o,u,i;return o=(65535&n.b)+(65535&e.b)+(65535&r.b)+(65535&a.b),u=(n.b>>>16)+(e.b>>>16)+(r.b>>>16)+(a.b>>>16)+(o>>>16),i=(65535&u)<<16|65535&o,o=(65535&n.a)+(65535&e.a)+(65535&r.a)+(65535&a.a)+(u>>>16),u=(n.a>>>16)+(e.a>>>16)+(r.a>>>16)+(a.a>>>16)+(o>>>16),new t((65535&u)<<16|65535&o,i)}function I(n,e,r,a,o){var u,i,w;return u=(65535&n.b)+(65535&e.b)+(65535&r.b)+(65535&a.b)+(65535&o.b),i=(n.b>>>16)+(e.b>>>16)+(r.b>>>16)+(a.b>>>16)+(o.b>>>16)+(u>>>16),w=(65535&i)<<16|65535&u,u=(65535&n.a)+(65535&e.a)+(65535&r.a)+(65535&a.a)+(65535&o.a)+(i>>>16),i=(n.a>>>16)+(e.a>>>16)+(r.a>>>16)+(a.a>>>16)+(o.a>>>16)+(u>>>16),new t((65535&i)<<16|65535&u,w)}function x(n,e){var t,r,a,o,u,i,w,f,b,l=[],h=[1732584193,4023233417,2562383102,271733878,3285377520];for(t=(e+65>>>9<<4)+15;n.length<=t;)n.push(0);for(n[e>>>5]|=128<<24-e%32,n[t]=e,b=n.length,w=0;b>w;w+=16){for(t=h[0],r=h[1],a=h[2],o=h[3],u=h[4],f=0;80>f;f+=1)l[f]=16>f?n[f+w]:s(l[f-3]^l[f-8]^l[f-14]^l[f-16],1),i=20>f?y(s(t,5),r&a^~r&o,u,1518500249,l[f]):40>f?y(s(t,5),r^a^o,u,1859775393,l[f]):60>f?y(s(t,5),v(r,a,o),u,2400959708,l[f]):y(s(t,5),r^a^o,u,3395469782,l[f]),u=o,o=a,a=s(r,30),r=t,t=i;h[0]=L(t,h[0]),h[1]=L(r,h[1]),h[2]=L(a,h[2]),h[3]=L(o,h[3]),h[4]=L(u,h[4])}return h}function P(n,e,r){var a,o,u,i,w,f,b,s,l,h,c,x,P,Y,k,O,N,j,z,M,R,Z,q,D,G,J,K=[],Q=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];if(h=[3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428],o=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225],"SHA-224"===r||"SHA-256"===r)c=64,a=(e+65>>>9<<4)+15,Y=16,k=1,G=Number,O=L,N=X,j=y,z=E,M=U,R=d,Z=H,D=v,q=p,h="SHA-224"===r?h:o;else{if("SHA-384"!==r&&"SHA-512"!==r)throw"Unexpected error in SHA-2 implementation";c=80,a=(e+128>>>10<<5)+31,Y=32,k=2,G=t,O=C,N=F,j=I,z=T,M=B,R=A,Z=m,D=S,q=g,Q=[new G(Q[0],3609767458),new G(Q[1],602891725),new G(Q[2],3964484399),new G(Q[3],2173295548),new G(Q[4],4081628472),new G(Q[5],3053834265),new G(Q[6],2937671579),new G(Q[7],3664609560),new G(Q[8],2734883394),new G(Q[9],1164996542),new G(Q[10],1323610764),new G(Q[11],3590304994),new G(Q[12],4068182383),new G(Q[13],991336113),new G(Q[14],633803317),new G(Q[15],3479774868),new G(Q[16],2666613458),new G(Q[17],944711139),new G(Q[18],2341262773),new G(Q[19],2007800933),new G(Q[20],1495990901),new G(Q[21],1856431235),new G(Q[22],3175218132),new G(Q[23],2198950837),new G(Q[24],3999719339),new G(Q[25],766784016),new G(Q[26],2566594879),new G(Q[27],3203337956),new G(Q[28],1034457026),new G(Q[29],2466948901),new G(Q[30],3758326383),new G(Q[31],168717936),new G(Q[32],1188179964),new G(Q[33],1546045734),new G(Q[34],1522805485),new G(Q[35],2643833823),new G(Q[36],2343527390),new G(Q[37],1014477480),new G(Q[38],1206759142),new G(Q[39],344077627),new G(Q[40],1290863460),new G(Q[41],3158454273),new G(Q[42],3505952657),new G(Q[43],106217008),new G(Q[44],3606008344),new G(Q[45],1432725776),new G(Q[46],1467031594),new G(Q[47],851169720),new G(Q[48],3100823752),new G(Q[49],1363258195),new G(Q[50],3750685593),new G(Q[51],3785050280),new G(Q[52],3318307427),new G(Q[53],3812723403),new G(Q[54],2003034995),new G(Q[55],3602036899),new G(Q[56],1575990012),new G(Q[57],1125592928),new G(Q[58],2716904306),new G(Q[59],442776044),new G(Q[60],593698344),new G(Q[61],3733110249),new G(Q[62],2999351573),new G(Q[63],3815920427),new G(3391569614,3928383900),new G(3515267271,566280711),new G(3940187606,3454069534),new G(4118630271,4000239992),new G(116418474,1914138554),new G(174292421,2731055270),new G(289380356,3203993006),new G(460393269,320620315),new G(685471733,587496836),new G(852142971,1086792851),new G(1017036298,365543100),new G(1126000580,2618297676),new G(1288033470,3409855158),new G(1501505948,4234509866),new G(1607167915,987167468),new G(1816402316,1246189591)],h="SHA-384"===r?[new G(3418070365,h[0]),new G(1654270250,h[1]),new G(2438529370,h[2]),new G(355462360,h[3]),new G(1731405415,h[4]),new G(41048885895,h[5]),new G(3675008525,h[6]),new G(1203062813,h[7])]:[new G(o[0],4089235720),new G(o[1],2227873595),new G(o[2],4271175723),new G(o[3],1595750129),new G(o[4],2917565137),new G(o[5],725511199),new G(o[6],4215389547),new G(o[7],327033209)]}for(;n.length<=a;)n.push(0);for(n[e>>>5]|=128<<24-e%32,n[a]=e,J=n.length,x=0;J>x;x+=Y){for(e=h[0],a=h[1],o=h[2],u=h[3],i=h[4],w=h[5],f=h[6],b=h[7],P=0;c>P;P+=1)16>P?(l=P*k+x,s=n.length<=l?0:n[l],l=n.length<=l+1?0:n[l+1],K[P]=new G(s,l)):K[P]=N(M(K[P-2]),K[P-7],z(K[P-15]),K[P-16]),s=j(b,Z(i),q(i,w,f),Q[P],K[P]),l=O(R(e),D(e,a,o)),b=f,f=w,w=i,i=O(u,s),u=o,o=a,a=e,e=O(s,l);h[0]=O(e,h[0]),h[1]=O(a,h[1]),h[2]=O(o,h[2]),h[3]=O(u,h[3]),h[4]=O(i,h[4]),h[5]=O(w,h[5]),h[6]=O(f,h[6]),h[7]=O(b,h[7])}if("SHA-224"===r)n=[h[0],h[1],h[2],h[3],h[4],h[5],h[6]];else if("SHA-256"===r)n=h;else if("SHA-384"===r)n=[h[0].a,h[0].b,h[1].a,h[1].b,h[2].a,h[2].b,h[3].a,h[3].b,h[4].a,h[4].b,h[5].a,h[5].b];else{if("SHA-512"!==r)throw"Unexpected error in SHA-2 implementation";n=[h[0].a,h[0].b,h[1].a,h[1].b,h[2].a,h[2].b,h[3].a,h[3].b,h[4].a,h[4].b,h[5].a,h[5].b,h[6].a,h[6].b,h[7].a,h[7].b]}return n}"function"==typeof define&&define.amd?define(function(){return e}):"undefined"!=typeof exports?"undefined"!=typeof module&&module.exports?module.exports=exports=e:exports=e:n.jsSHA=e}(this);
// misc conversion-functions
function hexToBytes(n) {
  for (var t = [], r = 0; r < n.length; r += 2) t.push(parseInt(n.substr(r, 2), 16));
  return t
}
function dec2hex(n) {
  return (15.5 > n ? "0" : "") + Math.round(n).toString(16)
}
function leftpad(n, t, r) {
  return t + 1 >= n.length && (n = Array(t + 1 - n.length).join(r) + n), n
}
function base64ToHex(n) {
  for (var t = 0, r = atob(n.replace(/[ \r\n]+$/, "")), e = []; t < r.length; ++t) {
    var o = r.charCodeAt(t).toString(16);
    1 === o.length && (o = "0" + o), e[e.length] = o
  }
  return e.join(" ")
}
function strToHex(str) {
	var hex = '';
	for(var i=0;i<str.length;i++) {
		hex += ''+str.charCodeAt(i).toString(16);
	}
	return hex;
}

// main functions
function generateAuthCode(secret, timeOffset) {
	var secret = base64ToHex(secret).replace(/ /g, '');
	var epoch = Math.floor(Date.now() / 1000) + (timeOffset || 0);
	var time = leftpad(dec2hex(Math.floor(epoch / 30)), 16, 0);

	// Let the hashing begin
	var hmacObj = new jsSHA(time, "HEX");
	var hmac = hmacObj.getHMAC(secret, "HEX", "SHA-1", "HEX");

	hmac = hexToBytes(hmac);

	// Pick the last part of the buffer and then pick 4 2-bytes
	var start = hmac[19] & 0x0F;
	hmac = hmac.slice(start, start + 4);

	// Read ArrayBuffer - Magic comes in
	var fullcode = ((hmac[0] * 0x1000000) + (hmac[1] << 16) | (hmac[2] << 8) | hmac[3]) & 0x7fffffff;
	var chars = '23456789BCDFGHJKMNPQRTVWXY';

	var code = '';
	for(var i = 0; i < 5; i++) {
	  code += chars.charAt(fullcode % chars.length);
	  fullcode /= chars.length;
	}

	return(code);
}

function getConfirmationKey(identitySecret, time, tag) {

	// Possible tags are:
	// 'conf', 'details', 'allow', 'cancel'
	var dfd = $.Deferred();
	var dataLen = 8;
	var buffer;

	// Buffersize generated by needed action
	if(tag) {
		if(tag.length > 32) {
			dataLen += 32;
		} else {
			dataLen += tag.length;
		}
	}

	// Put everything together in a hex-string
	buffer = '00000000'+dec2hex(time)+strToHex(tag);

	// Let the hashing begin and return base64 (last parameter of getHmac)
	var hmacObj = new jsSHA(buffer, "HEX");
	var hmac = hmacObj.getHMAC(identitySecret, "B64", "SHA-1", "B64");
	dfd.resolve(hmac);

	return dfd.promise();
};

function getServerTime(){

	var dfd = $.Deferred();

	$.ajax({
		type:"POST",
		url: "https://api.steampowered.com/ITwoFactorService/QueryTime/v1/",
		success: function(data){

			var serverTime = data.response["server_time"];
			var localTime = Math.floor(Date.now() / 1000);
			var timeOffset = serverTime - localTime;
			var time = Math.floor(Date.now() / 1000) + timeOffset;

			dfd.resolve(time);
		},
    error: function (xhr, textStatus, errorThrown){
			if (xhr.status == 503) {
					// Todo: Add Retry
          // This is service unavailable
      } else if (xhr.status == 504) {
      		// Todo: Add Retry
          // This is a gateway timeout
      } else {
				console.log('getting servertime failed');
			}
    }
	});

	return dfd.promise();
}
/*

SDA generates DeviceID´s (Android-Phone) randomly, so it isn´t possible
to generate the same DeviceID.

function generateDeviceId(steamID){

	var steamidhex = textToHex(steamID);
	console.log("steamID Str: "+steamID+"\nsteamID Hex: "+steamidhex);
	var sha1 = new jsSHA(steamidhex, "HEX");
	console.log(sha1);
	var replace = $(sha1).toString().replace(/^([0-9a-f]{8})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{12}).*$/, '$1-$2-$3-$4-$5');

	console.log(replace);
	return "android:" + Crypto.createHash('sha1').update(steamID.toString()).digest('hex')
		.replace(/^([0-9a-f]{8})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{12}).*$/, '$1-$2-$3-$4-$5');

}*/
