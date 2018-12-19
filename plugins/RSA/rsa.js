var RSAPublicKey = function($modulus_hex, $encryptionExponent_hex) {
	this.modulus = new BigInteger( $modulus_hex, 16);
	this.encryptionExponent = new BigInteger( $encryptionExponent_hex, 16);
};

var Base64 = {
	base64: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	encode: function($input) {
		if (!$input) {
			return false;
		}
		var $output = "";
		var $chr1, $chr2, $chr3;
		var $enc1, $enc2, $enc3, $enc4;
		var $i = 0;
		do {
			$chr1 = $input.charCodeAt($i++);
			$chr2 = $input.charCodeAt($i++);
			$chr3 = $input.charCodeAt($i++);
			$enc1 = $chr1 >> 2;
			$enc2 = (($chr1 & 3) << 4) | ($chr2 >> 4);
			$enc3 = (($chr2 & 15) << 2) | ($chr3 >> 6);
			$enc4 = $chr3 & 63;
			if (isNaN($chr2)) $enc3 = $enc4 = 64;
			else if (isNaN($chr3)) $enc4 = 64;
			$output += this.base64.charAt($enc1) + this.base64.charAt($enc2) + this.base64.charAt($enc3) + this.base64.charAt($enc4);
		} while ($i < $input.length);
		return $output;
	},
	decode: function($input) {
		if(!$input) return false;
		$input = $input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
		var $output = "";
		var $enc1, $enc2, $enc3, $enc4;
		var $i = 0;
		do {
			$enc1 = this.base64.indexOf($input.charAt($i++));
			$enc2 = this.base64.indexOf($input.charAt($i++));
			$enc3 = this.base64.indexOf($input.charAt($i++));
			$enc4 = this.base64.indexOf($input.charAt($i++));
			$output += String.fromCharCode(($enc1 << 2) | ($enc2 >> 4));
			if ($enc3 != 64) $output += String.fromCharCode((($enc2 & 15) << 4) | ($enc3 >> 2));
			if ($enc4 != 64) $output += String.fromCharCode((($enc3 & 3) << 6) | $enc4);
		} while ($i < $input.length);
		return $output;
	}
};

var Hex = {
	hex: "0123456789abcdef",
	encode: function($input) {
		if(!$input) return false;
		var $output = "";
		var $k;
		var $i = 0;
		do {
			$k = $input.charCodeAt($i++);
			$output += this.hex.charAt(($k >> 4) &0xf) + this.hex.charAt($k & 0xf);
		} while ($i < $input.length);
		return $output;
	},
	decode: function($input) {
		if(!$input) return false;
		$input = $input.replace(/[^0-9abcdef]/g, "");
		var $output = "";
		var $i = 0;
		do {
			$output += String.fromCharCode(((this.hex.indexOf($input.charAt($i++)) << 4) & 0xf0) | (this.hex.indexOf($input.charAt($i++)) & 0xf));
		} while ($i < $input.length);
		return $output;
	}
};

var RSA = {

	getPublicKey: function( $modulus_hex, $exponent_hex ) {
		return new RSAPublicKey( $modulus_hex, $exponent_hex );
	},

	encrypt: function($data, $pubkey) {
		if (!$pubkey) return false;
		$data = this.pkcs1pad2($data,($pubkey.modulus.bitLength()+7)>>3);
		if(!$data) return false;
		$data = $data.modPowInt($pubkey.encryptionExponent, $pubkey.modulus);
		if(!$data) return false;
		$data = $data.toString(16);
		if(($data.length & 1) == 1)
			$data = "0" + $data;
		return Base64.encode(Hex.decode($data));
	},

	pkcs1pad2: function($data, $keysize) {
		if($keysize < $data.length + 11)
			return null;
		var $buffer = [];
		var $i = $data.length - 1;
		while($i >= 0 && $keysize > 0)
			$buffer[--$keysize] = $data.charCodeAt($i--);
		$buffer[--$keysize] = 0;
		while($keysize > 2)
			$buffer[--$keysize] = Math.floor(Math.random()*254) + 1;
		$buffer[--$keysize] = 2;
		$buffer[--$keysize] = 0;
		return new BigInteger($buffer);
	}
};
