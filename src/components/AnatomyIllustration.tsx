import type { RefObject } from "react";

type Props = {
  svgRef: RefObject<SVGSVGElement>;
  scannerRef: RefObject<SVGGElement>;
  traceRef: RefObject<SVGPathElement>;
  region: string;
};

export default function AnatomyIllustration({ svgRef, scannerRef, traceRef, region }: Props) {
  return <div className="anatomy-illustration-shell" aria-hidden="true">
    <svg ref={svgRef} className="anatomy-illustration" data-region={region} viewBox="0 0 420 900" role="img" aria-label="A luminous line illustration of the human body">
      <defs>
        <linearGradient id="anatomy-line" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e4d2a4"/><stop offset=".48" stopColor="#a6d5ac"/><stop offset="1" stopColor="#c4e4d3"/></linearGradient>
        <linearGradient id="anatomy-core" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#dfc17f" stopOpacity=".84"/><stop offset="1" stopColor="#dfc17f" stopOpacity=".12"/></linearGradient>
        <radialGradient id="anatomy-aura"><stop stopColor="#b6d9a5" stopOpacity=".2"/><stop offset="1" stopColor="#b6d9a5" stopOpacity="0"/></radialGradient>
        <filter id="anatomy-glow" x="-80%" y="-40%" width="260%" height="180%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <ellipse cx="210" cy="450" rx="175" ry="425" fill="url(#anatomy-aura)"/>
      <g className="anatomy-contour" fill="rgba(177,216,179,.025)" stroke="url(#anatomy-line)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
        <path d="M184 132c-2 17-7 27-20 34l-35 11c-14 5-23 14-29 31l-23 70c-3 9 0 16 7 19 7 3 13-1 17-9l20-47-7 85 10 84c2 17 11 26 27 29l2 44c-10 25-17 57-21 91l-13 117c-1 12 4 19 13 20 9 1 15-5 17-17l21-117h8l22 117c2 11 8 18 17 17 9-1 14-8 12-20l-14-117c-4-34-11-66-21-91l2-44c16-3 25-12 27-29l10-84-7-85 20 47c4 8 10 12 17 9 7-3 10-10 7-19l-23-70c-6-17-15-26-29-31l-35-11c-13-7-18-17-20-34Z"/>
        <path d="M184 129c0-39 12-62 26-62s26 23 26 62c0 34-9 50-26 50s-26-16-26-50Z" fill="rgba(177,216,179,.045)"/>
        <path d="M184 120c9 7 17 10 26 10s17-3 26-10M190 150c7 6 13 9 20 9s13-3 20-9" fill="none" strokeOpacity=".55"/>
      </g>
      <g className="anatomy-zone anatomy-head" fill="none" stroke="url(#anatomy-line)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="M197 84c-8 8-9 21-4 28 4 6 10 7 17 7s13-1 17-7c5-7 4-20-4-28-7-7-19-7-26 0Z"/>
        <path d="M210 78v43m-16-24 12 6-10 7m20-13-12 6 10 7M198 104h8m8 0h8M197 110c4 4 8 6 13 6s9-2 13-6"/>
        <circle cx="198" cy="101" r="2"/><circle cx="222" cy="101" r="2"/>
      </g>
      <g className="anatomy-zone anatomy-chest" fill="none" stroke="url(#anatomy-line)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M207 190c-19-18-38-8-39 14-1 21 15 44 39 59 24-15 40-38 39-59-1-22-20-32-39-14Z" opacity=".64"/>
        <path d="M205 196c-8-13-21-16-29-6-9 11-2 35 17 51 6 5 12 9 17 12m5-57c8-13 21-16 29-6 9 11 2 35-17 51-6 5-12 9-17 12"/>
        <path d="M210 193v62m0-43c-10-11-16-16-26-19m26 32c10-11 16-16 26-19m-26 42c-13-8-23-10-32-10m32 10c13-8 23-10 32-10" strokeOpacity=".52"/>
      </g>
      <g className="anatomy-zone anatomy-core" fill="none" stroke="url(#anatomy-core)" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
        <path d="M190 306c9-14 31-14 40 0 8 13 3 27-4 34 13 8 17 26 5 39-11 12-40 12-51 0-12-13-8-31 5-39-7-7-12-21-4-34Z"/>
        <path d="M199 305c-5 10-4 19 3 25 7 7 8 13 1 21-7 8-8 17-1 25m19-71c5 10 4 19-3 25-7 7-8 13-1 21 7 8 8 17 1 25m-29-35h43"/>
        <path d="M187 419c13 7 33 7 46 0m-44 11c13 9 29 9 42 0" strokeOpacity=".62"/>
      </g>
      <g className="anatomy-zone anatomy-limbs" fill="none" stroke="url(#anatomy-line)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M126 189c20 12 34 30 43 51m-59 32c21 8 39 6 53-5m-49 35c18 9 36 11 53 7m27 108c-10 12-16 25-18 42m-7 39c-13 24-18 46-21 74m-13 98c10 6 19 7 28 3m65-514c-20 12-34 30-43 51m59 32c-21 8-39 6-53-5m49 35c-18 9-36 11-53 7m-27 108c10 12 16 25 18 42m7 39c13 24 18 46 21 74m13 98c-10 6-19 7-28 3"/>
        <path d="M210 256v164m0 1v105m0 0-19 115m19-115 20 115" strokeWidth="2" strokeOpacity=".65"/>
        <path d="M206 270c-15-8-25-9-37-4m41 17c14-8 24-9 36-4m-37 67c-9 11-17 22-25 36m27-36c9 11 17 22 25 36m-26 132c-12 11-19 24-24 43m26-43c12 11 19 24 24 43" strokeOpacity=".68"/>
        <path d="M169 688c-5 12-8 24-8 37 10 5 20 4 29-2m72-35c5 12 8 24 8 37-10 5-20 4-29-2"/>
      </g>
      <g className="anatomy-points" fill="#dfc17f" filter="url(#anatomy-glow)">
        <circle cx="210" cy="108" r="3"/><circle cx="210" cy="229" r="3.5"/><circle cx="210" cy="342" r="3"/><circle cx="210" cy="526" r="3"/><circle cx="210" cy="683" r="2.5"/>
      </g>
      <g ref={scannerRef} className="anatomy-scanner" transform="translate(0 45)">
        <path d="M68 0h284" stroke="#dfc17f" strokeWidth="1" strokeOpacity=".76" filter="url(#anatomy-glow)"/>
        <circle cx="210" cy="0" r="5" fill="#f2d995" filter="url(#anatomy-glow)"/>
      </g>
      <path ref={traceRef} className="anatomy-scan-trail" d="M210 60c-2 46 2 86 0 125s3 68 0 110 1 71 0 108 3 74 0 114 2 68 0 107 2 74 0 113" pathLength="100"/>
    </svg>
  </div>;
}
