// https://github.com/material-foundation/material-color-utilities/blob/ca894db8b6aebb2833f1805ae61573c92e3f1660/typescript/hct/viewing_conditions.ts#L21-L118

import { lerp, linearized, signum, whitePointD65, yFromLstar } from "./utils";

/**
 * In traditional color spaces, a color can be identified solely by the
 * observer's measurement of the color. Color appearance models such as CAM16
 * also use information about the environment where the color was
 * observed, known as the viewing conditions.
 *
 * For example, white under the traditional assumption of a midday sun white
 * point is accurately measured as a slightly chromatic blue by CAM16. (roughly,
 * hue 203, chroma 3, lightness 100)
 *
 * This class caches intermediate values of the CAM16 conversion process that
 * depend only on viewing conditions, enabling speed ups.
 */
export class ViewingConditions {
	/** sRGB-like viewing conditions.  */
	static DEFAULT = ViewingConditions.make();

	/**
	 * Create ViewingConditions from a simple, physically relevant, set of
	 * parameters.
	 *
	 * @param whitePoint White point, measured in the XYZ color space.
	 *     default = D65, or sunny day afternoon
	 * @param adaptingLuminance The luminance of the adapting field. Informally,
	 *     how bright it is in the room where the color is viewed. Can be
	 *     calculated from lux by multiplying lux by 0.0586. default = 11.72,
	 *     or 200 lux.
	 * @param backgroundLstar The lightness of the area surrounding the color.
	 *     measured by L* in L*a*b*. default = 50.0
	 * @param surround A general description of the lighting surrounding the
	 *     color. 0 is pitch dark, like watching a movie in a theater. 1.0 is a
	 *     dimly light room, like watching TV at home at night. 2.0 means there
	 *     is no difference between the lighting on the color and around it.
	 *     default = 2.0
	 * @param discountingIlluminant Whether the eye accounts for the tint of the
	 *     ambient lighting, such as knowing an apple is still red in green light.
	 *     default = false, the eye does not perform this process on
	 *       self-luminous objects like displays.
	 */
	static make(
		whitePoint = whitePointD65(),
		adaptingLuminance = ((200.0 / Math.PI) * yFromLstar(50.0)) / 100.0,
		backgroundLstar = 50.0,
		surround = 2.0,
		discountingIlluminant = false,
	): ViewingConditions {
		const xyz = whitePoint;
		const rW = xyz[0] * 0.401288 + xyz[1] * 0.650173 + xyz[2] * -0.051461;
		const gW = xyz[0] * -0.250268 + xyz[1] * 1.204414 + xyz[2] * 0.045854;
		const bW = xyz[0] * -0.002079 + xyz[1] * 0.048952 + xyz[2] * 0.953127;
		const f = 0.8 + surround / 10.0;
		const c = f >= 0.9
			? lerp(0.59, 0.69, (f - 0.9) * 10.0)
			: lerp(0.525, 0.59, (f - 0.8) * 10.0);
		let d = discountingIlluminant
			? 1.0
			: f
				* (1.0 - (1.0 / 3.6) * Math.exp((-adaptingLuminance - 42.0) / 92.0));
		d = d > 1.0 ? 1.0 : d < 0.0 ? 0.0 : d;
		const nc = f;
		const rgbD = [
			d * (100.0 / rW) + 1.0 - d,
			d * (100.0 / gW) + 1.0 - d,
			d * (100.0 / bW) + 1.0 - d,
		];
		const k = 1.0 / (5.0 * adaptingLuminance + 1.0);
		const k4 = k * k * k * k;
		const k4F = 1.0 - k4;
		const fl = k4 * adaptingLuminance
			+ 0.1 * k4F * k4F * Math.cbrt(5.0 * adaptingLuminance);
		const n = yFromLstar(backgroundLstar) / whitePoint[1];
		const z = 1.48 + Math.sqrt(n);
		const nbb = 0.725 / n ** 0.2;
		const ncb = nbb;
		const rgbAFactors = [
			((fl * rgbD[0] * rW) / 100.0) ** 0.42,
			((fl * rgbD[1] * gW) / 100.0) ** 0.42,
			((fl * rgbD[2] * bW) / 100.0) ** 0.42,
		];
		const rgbA = [
			(400.0 * rgbAFactors[0]) / (rgbAFactors[0] + 27.13),
			(400.0 * rgbAFactors[1]) / (rgbAFactors[1] + 27.13),
			(400.0 * rgbAFactors[2]) / (rgbAFactors[2] + 27.13),
		];
		const aw = (2.0 * rgbA[0] + rgbA[1] + 0.05 * rgbA[2]) * nbb;
		return new ViewingConditions(
			n,
			aw,
			nbb,
			ncb,
			c,
			nc,
			rgbD,
			fl,
			fl ** 0.25,
			z,
		);
	}

	/**
	 * Parameters are intermediate values of the CAM16 conversion process. Their
	 * names are shorthand for technical color science terminology, this class
	 * would not benefit from documenting them individually. A brief overview
	 * is available in the CAM16 specification, and a complete overview requires
	 * a color science textbook, such as Fairchild's Color Appearance Models.
	 */
	private constructor(
		public n: number,
		public aw: number,
		public nbb: number,
		public ncb: number,
		public c: number,
		public nc: number,
		public rgbD: number[],
		public fl: number,
		public fLRoot: number,
		public z: number,
	) {}
}
// ---

// https://github.com/material-foundation/material-color-utilities/blob/ca894db8b6aebb2833f1805ae61573c92e3f1660/typescript/hct/cam16.ts#L23-L418
/**
 * CAM16, a color appearance model. Colors are not just defined by their hex
 * code, but rather, a hex code and viewing conditions.
 *
 * CAM16 instances also have coordinates in the CAM16-UCS space, called J*, a*,
 * b*, or jstar, astar, bstar in code. CAM16-UCS is included in the CAM16
 * specification, and should be used when measuring distances between colors.
 *
 * In traditional color spaces, a color can be identified solely by the
 * observer's measurement of the color. Color appearance models such as CAM16
 * also use information about the environment where the color was
 * observed, known as the viewing conditions.
 *
 * For example, white under the traditional assumption of a midday sun white
 * point is accurately measured as a slightly chromatic blue by CAM16. (roughly,
 * hue 203, chroma 3, lightness 100)
 */
export class Cam16 {
	/**
	 * All of the CAM16 dimensions can be calculated from 3 of the dimensions, in
	 * the following combinations:
	 *      -  {j or q} and {c, m, or s} and hue
	 *      - jstar, astar, bstar
	 * Prefer using a static method that constructs from 3 of those dimensions.
	 * This constructor is intended for those methods to use to return all
	 * possible dimensions.
	 *
	 * @param hue
	 * @param chroma informally, colorfulness / color intensity. like saturation
	 *     in HSL, except perceptually accurate.
	 * @param j lightness
	 * @param q brightness; ratio of lightness to white point's lightness
	 * @param m colorfulness
	 * @param s saturation; ratio of chroma to white point's chroma
	 * @param jstar CAM16-UCS J coordinate
	 * @param astar CAM16-UCS a coordinate
	 * @param bstar CAM16-UCS b coordinate
	 */
	constructor(
		readonly hue: number,
		readonly chroma: number,
		readonly j: number,
		readonly q: number,
		readonly m: number,
		readonly s: number,
		readonly jstar: number,
		readonly astar: number,
		readonly bstar: number,
	) {}

	/**
	 * @param argb ARGB representation of a color.
	 * @return CAM16 color, assuming the color was viewed in default viewing
	 *     conditions.
	 */
	static fromInt(argb: number): Cam16 {
		return Cam16.fromIntInViewingConditions(argb, ViewingConditions.DEFAULT);
	}

	/**
	 * @param argb ARGB representation of a color.
	 * @param viewingConditions Information about the environment where the color
	 *     was observed.
	 * @return CAM16 color.
	 */
	static fromIntInViewingConditions(
		argb: number,
		viewingConditions: ViewingConditions,
	): Cam16 {
		const red = (argb & 0x00ff0000) >> 16;
		const green = (argb & 0x0000ff00) >> 8;
		const blue = argb & 0x000000ff;
		const redL = linearized(red);
		const greenL = linearized(green);
		const blueL = linearized(blue);
		const x = 0.41233895 * redL + 0.35762064 * greenL + 0.18051042 * blueL;
		const y = 0.2126 * redL + 0.7152 * greenL + 0.0722 * blueL;
		const z = 0.01932141 * redL + 0.11916382 * greenL + 0.95034478 * blueL;

		const rC = 0.401288 * x + 0.650173 * y - 0.051461 * z;
		const gC = -0.250268 * x + 1.204414 * y + 0.045854 * z;
		const bC = -0.002079 * x + 0.048952 * y + 0.953127 * z;

		const rD = viewingConditions.rgbD[0] * rC;
		const gD = viewingConditions.rgbD[1] * gC;
		const bD = viewingConditions.rgbD[2] * bC;

		const rAF = ((viewingConditions.fl * Math.abs(rD)) / 100.0) ** 0.42;
		const gAF = ((viewingConditions.fl * Math.abs(gD)) / 100.0) ** 0.42;
		const bAF = ((viewingConditions.fl * Math.abs(bD)) / 100.0) ** 0.42;

		const rA = (signum(rD) * 400.0 * rAF) / (rAF + 27.13);
		const gA = (signum(gD) * 400.0 * gAF) / (gAF + 27.13);
		const bA = (signum(bD) * 400.0 * bAF) / (bAF + 27.13);

		const a = (11.0 * rA + -12.0 * gA + bA) / 11.0;
		const b = (rA + gA - 2.0 * bA) / 9.0;
		const u = (20.0 * rA + 20.0 * gA + 21.0 * bA) / 20.0;
		const p2 = (40.0 * rA + 20.0 * gA + bA) / 20.0;
		const atan2 = Math.atan2(b, a);
		const atanDegrees = (atan2 * 180.0) / Math.PI;
		const hue = atanDegrees < 0
			? atanDegrees + 360.0
			: atanDegrees >= 360
			? atanDegrees - 360.0
			: atanDegrees;
		const hueRadians = (hue * Math.PI) / 180.0;

		const ac = p2 * viewingConditions.nbb;
		const j = 100.0
			* (ac / viewingConditions.aw)
				** (viewingConditions.c * viewingConditions.z);
		const q = (4.0 / viewingConditions.c)
			* Math.sqrt(j / 100.0)
			* (viewingConditions.aw + 4.0)
			* viewingConditions.fLRoot;
		const huePrime = hue < 20.14 ? hue + 360 : hue;
		const eHue = 0.25 * (Math.cos((huePrime * Math.PI) / 180.0 + 2.0) + 3.8);
		const p1 = (50000.0 / 13.0)
			* eHue
			* viewingConditions.nc
			* viewingConditions.ncb;
		const t = (p1 * Math.sqrt(a * a + b * b)) / (u + 0.305);
		const alpha = t ** 0.9 * (1.64 - 0.29 ** viewingConditions.n) ** 0.73;
		const c = alpha * Math.sqrt(j / 100.0);
		const m = c * viewingConditions.fLRoot;
		const s = 50.0
			* Math.sqrt(
				(alpha * viewingConditions.c) / (viewingConditions.aw + 4.0),
			);
		const jstar = ((1.0 + 100.0 * 0.007) * j) / (1.0 + 0.007 * j);
		const mstar = (1.0 / 0.0228) * Math.log(1.0 + 0.0228 * m);
		const astar = mstar * Math.cos(hueRadians);
		const bstar = mstar * Math.sin(hueRadians);

		return new Cam16(hue, c, j, q, m, s, jstar, astar, bstar);
	}

	/**
	 * @param j CAM16 lightness
	 * @param c CAM16 chroma
	 * @param h CAM16 hue
	 * @param viewingConditions Information about the environment where the color
	 *     was observed.
	 */
	static fromJchInViewingConditions(
		j: number,
		c: number,
		h: number,
		viewingConditions: ViewingConditions,
	): Cam16 {
		const q = (4.0 / viewingConditions.c)
			* Math.sqrt(j / 100.0)
			* (viewingConditions.aw + 4.0)
			* viewingConditions.fLRoot;
		const m = c * viewingConditions.fLRoot;
		const alpha = c / Math.sqrt(j / 100.0);
		const s = 50.0
			* Math.sqrt(
				(alpha * viewingConditions.c) / (viewingConditions.aw + 4.0),
			);
		const hueRadians = (h * Math.PI) / 180.0;
		const jstar = ((1.0 + 100.0 * 0.007) * j) / (1.0 + 0.007 * j);
		const mstar = (1.0 / 0.0228) * Math.log(1.0 + 0.0228 * m);
		const astar = mstar * Math.cos(hueRadians);
		const bstar = mstar * Math.sin(hueRadians);
		return new Cam16(h, c, j, q, m, s, jstar, astar, bstar);
	}
}
// ---
