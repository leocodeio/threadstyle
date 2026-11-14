type StickerProps = {
  readonly className?: string;
};

const STICKER_RIM = {
  fill: "var(--card)",
  stroke: "var(--card)",
  strokeWidth: 12,
  strokeLinejoin: "round",
} as const;

function TeeSticker({ className }: StickerProps) {
  const silhouette =
    "M44 36C32 36 21 40 15 46C11 50 10 56 12 62L19 78C21 83 27 85 32 82L44 76L44 122C44 127 48 131 54 131L106 131C112 131 116 127 116 122L116 76L128 82C133 85 139 83 141 78L148 62C150 56 149 50 145 46C139 40 128 36 116 36C108 36 102 39 98 43C94 49 87 53 80 53C73 53 66 49 62 43C58 39 52 36 44 36Z";

  return (
    <svg viewBox="0 0 160 160" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="tee-fill" x1="24" y1="20" x2="132" y2="136" gradientUnits="userSpaceOnUse">
          <stop stopColor="color-mix(in oklab, var(--primary) 74%, var(--card))" />
          <stop offset=".48" stopColor="var(--primary)" />
          <stop offset="1" stopColor="color-mix(in oklab, var(--primary) 82%, var(--primary-foreground))" />
        </linearGradient>
        <linearGradient id="tee-light" x1="20" y1="18" x2="140" y2="140" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--card)" stopOpacity=".5" />
          <stop offset=".38" stopColor="var(--card)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--primary-foreground)" stopOpacity=".18" />
        </linearGradient>
      </defs>

      <path d={silhouette} {...STICKER_RIM} />
      <path d={silhouette} fill="url(#tee-fill)" />
      <path d={silhouette} fill="url(#tee-light)" />

      <path
        d="M50 38C56 48 67 55 80 55C93 55 104 48 110 38L116 38C108 52 95 60 80 60C65 60 52 52 44 38Z"
        fill="var(--primary-foreground)"
        opacity=".1"
      />
      <path
        d="M48 40C53 41 58 44 62 48C67 54 73 57 80 57C87 57 93 54 98 48C102 44 107 41 112 40"
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity=".3"
      />

      <path
        d="M80 69C82.5 79 86 82.5 96 85C86 87.5 82.5 91 80 101C77.5 91 74 87.5 64 85C74 82.5 77.5 79 80 69Z"
        fill="var(--card)"
      />
      <circle cx="101" cy="71" r="2.5" fill="var(--card)" />
      <circle cx="60" cy="96" r="2" fill="var(--card)" />

      <path d="M45 73C48 67 49 61 47 55" fill="none" stroke="var(--primary-foreground)" strokeWidth="2" strokeLinecap="round" opacity=".16" />
      <path d="M115 73C112 67 111 61 113 55" fill="none" stroke="var(--primary-foreground)" strokeWidth="2" strokeLinecap="round" opacity=".16" />
      <path d="M48 123C66 127 94 127 112 123" fill="none" stroke="var(--primary-foreground)" strokeWidth="2" strokeLinecap="round" opacity=".14" />
      <path d="M50 43C55 39 61 37 67 37" fill="none" stroke="var(--card)" strokeWidth="3.5" strokeLinecap="round" opacity=".5" />
    </svg>
  );
}

function HoodieSticker({ className }: StickerProps) {
  const silhouette =
    "M46 52C36 50 26 54 20 61L9 80C6 86 9 93 15 95L31 100L31 138C31 144 36 149 42 149L118 149C124 149 129 144 129 138L129 100L145 95C151 93 154 86 151 80L140 61C134 54 124 50 114 52L106 54C116 42 114 28 103 21C93 14 67 14 57 21C46 28 44 42 54 54Z";

  return (
    <svg viewBox="0 0 160 168" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="hoodie-fill" x1="20" y1="24" x2="136" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="color-mix(in oklab, var(--accent) 64%, var(--card))" />
          <stop offset=".46" stopColor="var(--accent)" />
          <stop offset="1" stopColor="color-mix(in oklab, var(--accent) 54%, var(--accent-foreground))" />
        </linearGradient>
        <linearGradient id="hoodie-light" x1="18" y1="18" x2="140" y2="152" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--card)" stopOpacity=".55" />
          <stop offset=".4" stopColor="var(--card)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--accent-foreground)" stopOpacity=".16" />
        </linearGradient>
      </defs>

      <path d={silhouette} {...STICKER_RIM} />
      <path d={silhouette} fill="url(#hoodie-fill)" />
      <path d={silhouette} fill="url(#hoodie-light)" />

      <path
        d="M54 55C46 43 46 30 57 22C66 15 94 15 103 22C114 30 116 42 106 55"
        fill="none"
        stroke="var(--accent-foreground)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity=".32"
      />
      <path
        d="M62 54C62 42 70 35 80 35C90 35 98 42 98 54C98 58 96 60 92 60L68 60C64 60 62 58 62 54Z"
        fill="color-mix(in oklab, var(--accent) 32%, var(--card))"
        stroke="color-mix(in oklab, var(--accent-foreground) 68%, var(--accent))"
        strokeWidth="2.5"
      />
      <path
        d="M65 51C66 43 72 38 80 38"
        fill="none"
        stroke="var(--card)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".5"
      />
      <path d="M70 58C69 68 70 78 68 87" fill="none" stroke="var(--card)" strokeWidth="3" strokeLinecap="round" />
      <path d="M90 58C91 68 90 78 92 87" fill="none" stroke="var(--card)" strokeWidth="3" strokeLinecap="round" />
      <rect x="65.5" y="85" width="5" height="9" rx="2.5" fill="var(--primary)" />
      <rect x="89.5" y="85" width="5" height="9" rx="2.5" fill="var(--primary)" />

      <path
        d="M58 103C58 101 60 99 62 99H98C100 99 102 101 102 103V127C102 131 99 134 95 134H65C61 134 58 131 58 127Z"
        fill="var(--accent-foreground)"
        fillOpacity=".06"
        stroke="var(--accent-foreground)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        opacity=".5"
      />

      <path d="M46 97C49 91 50 85 48 79" fill="none" stroke="var(--accent-foreground)" strokeWidth="2" strokeLinecap="round" opacity=".2" />
      <path d="M114 97C111 91 110 85 112 79" fill="none" stroke="var(--accent-foreground)" strokeWidth="2" strokeLinecap="round" opacity=".2" />
      <path d="M35 141C63 146 97 146 125 141" fill="none" stroke="var(--accent-foreground)" strokeWidth="3" strokeLinecap="round" opacity=".3" />
      <path d="M52 58C57 55 63 53 69 53" fill="none" stroke="var(--card)" strokeWidth="3" strokeLinecap="round" opacity=".35" />
    </svg>
  );
}

function CapSticker({ className }: StickerProps) {
  const crown =
    "M28 62C28 38 46 22 72 22C98 22 116 38 116 62C116 66 113 69 109 69L35 69C31 69 28 66 28 62Z";
  const bill =
    "M102 55C124 53 142 57 150 63C154 66 153 72 147 75C132 82 114 83 102 77C97 75 97 57 102 55Z";

  return (
    <svg viewBox="0 0 160 120" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="cap-crown" x1="34" y1="22" x2="126" y2="68" gradientUnits="userSpaceOnUse">
          <stop stopColor="color-mix(in oklab, var(--foreground) 62%, var(--card))" />
          <stop offset=".5" stopColor="var(--foreground)" />
          <stop offset="1" stopColor="color-mix(in oklab, var(--foreground) 82%, var(--primary-foreground))" />
        </linearGradient>
        <linearGradient id="cap-bill" x1="36" y1="64" x2="146" y2="88" gradientUnits="userSpaceOnUse">
          <stop stopColor="color-mix(in oklab, var(--foreground) 88%, var(--card))" />
          <stop offset="1" stopColor="color-mix(in oklab, var(--foreground) 80%, var(--primary-foreground))" />
        </linearGradient>
        <linearGradient id="cap-light" x1="32" y1="20" x2="128" y2="74" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--card)" stopOpacity=".4" />
          <stop offset=".42" stopColor="var(--card)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--primary-foreground)" stopOpacity=".18" />
        </linearGradient>
      </defs>

      <path d={bill} {...STICKER_RIM} />
      <path d={bill} fill="url(#cap-bill)" />
      <path d={bill} fill="url(#cap-light)" />
      <path d="M108 61C124 59 138 62 145 67" fill="none" stroke="var(--card)" strokeWidth="2.5" strokeLinecap="round" opacity=".2" />

      <path d={crown} {...STICKER_RIM} />
      <path d={crown} fill="url(#cap-crown)" />
      <path d={crown} fill="url(#cap-light)" />

      <path d="M72 23V57" fill="none" stroke="var(--primary-foreground)" strokeWidth="1.5" strokeLinecap="round" opacity=".2" />
      <path d="M72 23C67 35 65 47 64 57" fill="none" stroke="var(--primary-foreground)" strokeWidth="1.5" strokeLinecap="round" opacity=".18" />
      <path d="M72 23C78 35 82 47 83 57" fill="none" stroke="var(--primary-foreground)" strokeWidth="1.5" strokeLinecap="round" opacity=".18" />

      <path d="M31 61C46 58 98 58 113 61L113 67C98 64 46 64 31 67Z" fill="var(--primary-foreground)" opacity=".18" />
      <circle cx="72" cy="22" r="5" fill="var(--primary)" />
      <circle cx="70.4" cy="20.4" r="1.8" fill="var(--card)" opacity=".5" />

      <path
        d="M74 38C75.4 43 77 44.6 82 46C77 47.4 75.4 49 74 54C72.6 49 71 47.4 66 46C71 44.6 72.6 43 74 38Z"
        fill="var(--primary)"
      />
      <path d="M38 36C44 28 52 24 60 22" fill="none" stroke="var(--card)" strokeWidth="3.5" strokeLinecap="round" opacity=".35" />
    </svg>
  );
}

function ToteSticker({ className }: StickerProps) {
  const bag =
    "M38 60H122C126 60 129 62 130 67L137 128C138 135 133 141 126 141H34C27 141 22 135 23 128L30 67C31 62 34 60 38 60Z";
  const leftStrap = "M54 64C54 37 57 24 64 24C71 24 74 37 74 64";
  const rightStrap = "M86 64C86 37 89 24 96 24C103 24 106 37 106 64";

  return (
    <svg viewBox="0 0 160 168" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="tote-fill" x1="26" y1="60" x2="134" y2="142" gradientUnits="userSpaceOnUse">
          <stop stopColor="color-mix(in oklab, var(--secondary) 55%, var(--card))" />
          <stop offset=".5" stopColor="var(--secondary)" />
          <stop offset="1" stopColor="color-mix(in oklab, var(--secondary) 84%, var(--foreground))" />
        </linearGradient>
        <linearGradient id="tote-light" x1="24" y1="58" x2="136" y2="142" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--card)" stopOpacity=".5" />
          <stop offset=".42" stopColor="var(--card)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--foreground)" stopOpacity=".12" />
        </linearGradient>
      </defs>

      <g fill="none" strokeLinecap="round">
        <path d={leftStrap} stroke="var(--card)" strokeWidth="15" />
        <path d={rightStrap} stroke="var(--card)" strokeWidth="15" />
        <path d={leftStrap} stroke="var(--foreground)" strokeWidth="7" opacity=".82" />
        <path d={rightStrap} stroke="var(--foreground)" strokeWidth="7" opacity=".82" />
      </g>

      <path d={bag} {...STICKER_RIM} />
      <path d={bag} fill="url(#tote-fill)" />
      <path d={bag} fill="url(#tote-light)" />

      <path d="M38 66H122" stroke="var(--foreground)" strokeWidth="4" opacity=".16" />
      <path
        d="M42 74H118"
        fill="none"
        stroke="var(--foreground)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 5"
        opacity=".22"
      />

      <g stroke="var(--primary)" strokeWidth="3" strokeLinecap="round">
        <path d="M80 86V81" />
        <path d="M80 126V131" />
        <path d="M60 106H55" />
        <path d="M100 106H105" />
        <path d="M66 92L62 88" />
        <path d="M94 92L98 88" />
        <path d="M66 120L62 124" />
        <path d="M94 120L98 124" />
      </g>
      <circle cx="80" cy="106" r="15" fill="var(--primary)" />
      <ellipse cx="75" cy="100" rx="6" ry="4" fill="var(--card)" opacity=".35" />
      <circle cx="74" cy="105" r="1.7" fill="var(--primary-foreground)" />
      <circle cx="86" cy="105" r="1.7" fill="var(--primary-foreground)" />
      <path
        d="M73 111C76 115 84 115 87 111"
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HeroStickers() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden select-none lg:block"
    >
      <TeeSticker className="hero-sticker absolute left-[2.5%] top-10 w-[104px] -rotate-[8deg] xl:left-[8.5%] xl:top-14 xl:w-[148px]" />
      <HoodieSticker className="hero-sticker absolute right-[2%] top-9 w-[110px] rotate-[7deg] xl:right-[8%] xl:top-12 xl:w-[154px]" />
      <CapSticker className="hero-sticker absolute bottom-12 left-[5%] w-[96px] rotate-[9deg] xl:bottom-14 xl:left-[10.5%] xl:w-[132px]" />
      <ToteSticker className="hero-sticker absolute bottom-10 right-[5%] w-[100px] -rotate-[6deg] xl:bottom-12 xl:right-[10.5%] xl:w-[138px]" />
    </div>
  );
}
