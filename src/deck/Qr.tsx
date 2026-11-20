import React from 'react';
import QRCode from 'qrcode';
import {QR} from './theme';
import {Txt} from './Txt';

/**
 * R11: links are QR codes plus a short printed URL. The QR is drawn as SVG rects from the `qrcode` package's module matrix
 * (white tile, dark modules, 4-module quiet zone, error correction M), so it stays sharp at any render scale.
 */

/** "https://www.wearenext.tech/" -> "wearenext.tech" (the short URL that is printed under the QR). */
export const shortUrl = (url: string): string =>
  url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '');

export type QrProps = {
  /** The exact text that is encoded (a full URL). */
  text: string;
  /** Minimum tile size in px (default and floor: 280). The tile is rounded UP to a whole number of pixels per module. */
  size?: number;
};

/** Just the white tile with the code, no caption. */
export const Qr: React.FC<QrProps> = ({text, size = QR.minSize}) => {
  const qr = QRCode.create(text, {errorCorrectionLevel: QR.errorCorrection});
  const n = qr.modules.size;
  const total = n + QR.quietModules * 2;
  const module = Math.ceil(Math.max(size, QR.minSize) / total); // whole pixels per module: crisp edges
  const side = module * total;
  const rects: React.ReactNode[] = [];
  for (let row = 0; row < n; row += 1) {
    for (let col = 0; col < n; col += 1) {
      if (qr.modules.get(row, col)) {
        rects.push(<rect key={`${row}-${col}`} x={(col + QR.quietModules) * module} y={(row + QR.quietModules) * module} width={module} height={module} />);
      }
    }
  }
  return (
    <svg width={side} height={side} viewBox={`0 0 ${side} ${side}`} shapeRendering="crispEdges" style={{display: 'block', borderRadius: 12}}>
      <rect width={side} height={side} fill="#ffffff" />
      <g fill="#000000">{rects}</g>
    </svg>
  );
};

/** QR tile with the short printed URL under it (body size, 32 px). Pass the full URL; the printed text is derived from it. */
export const QrBlock: React.FC<QrProps & {printed?: string}> = ({text, size, printed}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20}}>
    <Qr text={text} size={size} />
    <Txt size="body" tone="secondary" align="center">
      {printed ?? shortUrl(text)}
    </Txt>
  </div>
);

/** Encoded size of the QR tile in px, for layouts that must reserve the room (same maths as <Qr>). */
export const qrSide = (text: string, size: number = QR.minSize): number => {
  const n = QRCode.create(text, {errorCorrectionLevel: QR.errorCorrection}).modules.size;
  const total = n + QR.quietModules * 2;
  return Math.ceil(Math.max(size, QR.minSize) / total) * total;
};

