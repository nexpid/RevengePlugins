// https://github.com/material-foundation/material-color-utilities/blob/ca894db8b6aebb2833f1805ae61573c92e3f1660/typescript/utils/math_utils.ts#L20-L145
/**
 * Utility methods for mathematical operations.
 */

/**
 * The signum function.
 *
 * @return 1 if num > 0, -1 if num < 0, and 0 if num = 0
 */
export function signum(num: number): number {
	if (num < 0) {
		return -1;
	}
	if (num === 0) {
		return 0;
	}
	return 1;
}

/**
 * The linear interpolation function.
 *
 * @return start if amount = 0 and stop if amount = 1
 */
export function lerp(start: number, stop: number, amount: number): number {
	return (1.0 - amount) * start + amount * stop;
}

/**
 * Clamps an integer between two integers.
 *
 * @return input when min <= input <= max, and either min or max
 * otherwise.
 */
export function clampInt(min: number, max: number, input: number): number {
	if (input < min) {
		return min;
	}
	if (input > max) {
		return max;
	}

	return input;
}

/**
 * Sanitizes a degree measure as a floating-point number.
 *
 * @return a degree measure between 0.0 (inclusive) and 360.0
 * (exclusive).
 */
export function sanitizeDegreesDouble(degrees: number): number {
	degrees %= 360.0;
	if (degrees < 0) {
		degrees += 360.0;
	}
	return degrees;
}

/**
 * Multiplies a 1x3 row vector with a 3x3 matrix.
 */
export function matrixMultiply(row: number[], matrix: number[][]): number[] {
	const a = row[0] * matrix[0][0] + row[1] * matrix[0][1] + row[2] * matrix[0][2];
	const b = row[0] * matrix[1][0] + row[1] * matrix[1][1] + row[2] * matrix[1][2];
	const c = row[0] * matrix[2][0] + row[1] * matrix[2][1] + row[2] * matrix[2][2];
	return [a, b, c];
}
// ---

// https://github.com/material-foundation/material-color-utilities/blob/ca894db8b6aebb2833f1805ae61573c92e3f1660/typescript/utils/color_utils.ts#L22-L299
/**
 * Color science utilities.
 *
 * Utility methods for color science constants and color space
 * conversions that aren't HCT or CAM16.
 */

const SRGB_TO_XYZ = [
	[0.41233895, 0.35762064, 0.18051042],
	[0.2126, 0.7152, 0.0722],
	[0.01932141, 0.11916382, 0.95034478],
];

const XYZ_TO_SRGB = [
	[3.2413774792388685, -1.5376652402851851, -0.49885366846268053],
	[-0.9691452513005321, 1.8758853451067872, 0.04156585616912061],
	[0.05562093689691305, -0.20395524564742123, 1.0571799111220335],
];

const WHITE_POINT_D65 = [95.047, 100.0, 108.883];

/**
 * Converts a color from RGB components to ARGB format.
 */
export function argbFromRgb(red: number, green: number, blue: number): number {
	return (
		((255 << 24)
			| ((red & 255) << 16)
			| ((green & 255) << 8)
			| (blue & 255))
		>>> 0
	);
}

/**
 * Converts a color from linear RGB components to ARGB format.
 */
export function argbFromLinrgb(linrgb: number[]): number {
	const r = delinearized(linrgb[0]);
	const g = delinearized(linrgb[1]);
	const b = delinearized(linrgb[2]);
	return argbFromRgb(r, g, b);
}

/**
 * Returns the alpha component of a color in ARGB format.
 */
export function alphaFromArgb(argb: number): number {
	return (argb >> 24) & 255;
}

/**
 * Returns the red component of a color in ARGB format.
 */
export function redFromArgb(argb: number): number {
	return (argb >> 16) & 255;
}

/**
 * Returns the green component of a color in ARGB format.
 */
export function greenFromArgb(argb: number): number {
	return (argb >> 8) & 255;
}

/**
 * Returns the blue component of a color in ARGB format.
 */
export function blueFromArgb(argb: number): number {
	return argb & 255;
}

/**
 * Converts a color from ARGB to XYZ.
 */
export function argbFromXyz(x: number, y: number, z: number): number {
	const matrix = XYZ_TO_SRGB;
	const linearR = matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * z;
	const linearG = matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * z;
	const linearB = matrix[2][0] * x + matrix[2][1] * y + matrix[2][2] * z;
	const r = delinearized(linearR);
	const g = delinearized(linearG);
	const b = delinearized(linearB);
	return argbFromRgb(r, g, b);
}

/**
 * Converts a color from XYZ to ARGB.
 */
export function xyzFromArgb(argb: number): number[] {
	const r = linearized(redFromArgb(argb));
	const g = linearized(greenFromArgb(argb));
	const b = linearized(blueFromArgb(argb));
	return matrixMultiply([r, g, b], SRGB_TO_XYZ);
}

/**
 * Converts an L* value to an ARGB representation.
 *
 * @param lstar L* in L*a*b*
 * @return ARGB representation of grayscale color with lightness
 * matching L*
 */
export function argbFromLstar(lstar: number): number {
	const y = yFromLstar(lstar);
	const component = delinearized(y);
	return argbFromRgb(component, component, component);
}

/**
 * Computes the L* value of a color in ARGB representation.
 *
 * @param argb ARGB representation of a color
 * @return L*, from L*a*b*, coordinate of the color
 */
export function lstarFromArgb(argb: number): number {
	const y = xyzFromArgb(argb)[1];
	return 116.0 * labF(y / 100.0) - 16.0;
}

/**
 * Converts an L* value to a Y value.
 *
 * L* in L*a*b* and Y in XYZ measure the same quantity, luminance.
 *
 * L* measures perceptual luminance, a linear scale. Y in XYZ
 * measures relative luminance, a logarithmic scale.
 *
 * @param lstar L* in L*a*b*
 * @return Y in XYZ
 */
export function yFromLstar(lstar: number): number {
	return 100.0 * labInvf((lstar + 16.0) / 116.0);
}

/**
 * Linearizes an RGB component.
 *
 * @param rgbComponent 0 <= rgb_component <= 255, represents R/G/B
 * channel
 * @return 0.0 <= output <= 100.0, color channel converted to
 * linear RGB space
 */
export function linearized(rgbComponent: number): number {
	const normalized = rgbComponent / 255.0;
	if (normalized <= 0.040449936) {
		return (normalized / 12.92) * 100.0;
	}
	return ((normalized + 0.055) / 1.055) ** 2.4 * 100.0;
}

/**
 * Delinearizes an RGB component.
 *
 * @param rgbComponent 0.0 <= rgb_component <= 100.0, represents
 * linear R/G/B channel
 * @return 0 <= output <= 255, color channel converted to regular
 * RGB space
 */
export function delinearized(rgbComponent: number): number {
	const normalized = rgbComponent / 100.0;
	let delinearized = 0.0;
	if (normalized <= 0.0031308) {
		delinearized = normalized * 12.92;
	} else {
		delinearized = 1.055 * normalized ** (1.0 / 2.4) - 0.055;
	}
	return clampInt(0, 255, Math.round(delinearized * 255.0));
}

/**
 * Returns the standard white point; white on a sunny day.
 *
 * @return The white point
 */
export function whitePointD65(): number[] {
	return WHITE_POINT_D65;
}

function labF(t: number): number {
	const e = 216.0 / 24389.0;
	const kappa = 24389.0 / 27.0;
	if (t > e) {
		return t ** (1.0 / 3.0);
	}
	return (kappa * t + 16) / 116;
}

function labInvf(ft: number): number {
	const e = 216.0 / 24389.0;
	const kappa = 24389.0 / 27.0;
	const ft3 = ft * ft * ft;
	if (ft3 > e) {
		return ft3;
	}
	return (116 * ft - 16) / kappa;
}
// ---
