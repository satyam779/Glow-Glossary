// An empty box that tells the 3D tin where to sit in this section.
// The tin flies to the box's centre and matches its height; the data attributes set its pose:
//   yaw  – spin in degrees (0 = label facing you)
//   tilt – top toward the viewer, in degrees
//   lean – sideways lean, in degrees (negative leans right)
//   lid  – 0 closed … 1 lifted off
//   powder – 1 = resting in the powder heap (hero only)
export default function TinSlot({ className = '', yaw = 0, tilt = 12, lean = 0, lid = 0, powder = 0, fallback }) {
  return (
    <div
      className={`tin-slot ${className}`}
      data-tin=""
      data-yaw={yaw}
      data-tilt={tilt}
      data-lean={lean}
      data-lid={lid}
      data-powder={powder}
      aria-hidden="true"
    >
      {fallback && <img className="tin-fallback" src={fallback} alt="" />}
    </div>
  );
}
