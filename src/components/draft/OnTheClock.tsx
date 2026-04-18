import type { DraftPlayer } from '../../types';

interface OnTheClockProps {
  picker: DraftPlayer;
  pickNumber: number;
  totalPicks: number;
  round: number;
  pickInRound: number;
  upcoming: DraftPlayer[];
}

export function OnTheClock({
  picker,
  pickNumber,
  totalPicks,
  round,
  pickInRound,
  upcoming,
}: OnTheClockProps) {
  const colorHex = picker.colorHex;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border bg-white/[0.02] p-5 transition-all duration-500 sm:p-7"
      style={{ borderColor: `${colorHex}40` }}
    >
      {/* Ambient color wash */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: `radial-gradient(600px 180px at 30% 0%, ${colorHex}22, transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full blur-3xl"
        style={{ backgroundColor: `${colorHex}30` }}
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="relative inline-flex h-2 w-2"
            >
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                style={{ backgroundColor: colorHex }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ backgroundColor: colorHex }}
              />
            </span>
            <span
              className="font-['DM_Sans'] text-[10px] font-bold uppercase tracking-[0.25em]"
              style={{ color: colorHex }}
            >
              On the clock
            </span>
          </div>

          <h2
            className="truncate font-['Anybody'] text-4xl font-black uppercase tracking-wider text-white sm:text-6xl"
            style={{ textShadow: `0 0 30px ${colorHex}55` }}
          >
            {picker.name}
          </h2>

          {upcoming.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-white/40">
              <span className="font-['DM_Sans'] font-semibold uppercase tracking-wider">
                Next
              </span>
              {upcoming.map((p, i) => (
                <span key={`${p.name}-${i}`} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-white/20">·</span>}
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: p.colorHex }}
                  />
                  <span className="font-['DM_Sans'] font-semibold text-white/60">
                    {p.name}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-4 sm:gap-5">
          <div className="text-right">
            <div className="font-['DM_Sans'] text-[10px] font-bold uppercase tracking-widest text-white/40">
              Pick
            </div>
            <div className="font-['Anybody'] text-3xl font-black tabular-nums text-white sm:text-4xl">
              {pickNumber}
              <span className="text-white/25">/{totalPicks}</span>
            </div>
          </div>
          <div className="h-12 w-px bg-white/10" />
          <div className="text-right">
            <div className="font-['DM_Sans'] text-[10px] font-bold uppercase tracking-widest text-white/40">
              Round
            </div>
            <div className="font-['Anybody'] text-3xl font-black tabular-nums text-white sm:text-4xl">
              {round}
              <span className="font-['DM_Sans'] text-base font-semibold text-white/40">
                .{pickInRound}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
