import {
  AbsoluteFill,
  Img,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export type TradieProps = {
  tradieName: string;
  jobAddress: string;
  jobType: string;
  coCNumber: string;
  photos: string[];
  brand: { name: string; colour: string };
};

const TitleCard: React.FC<{ brand: TradieProps["brand"]; jobType: string }> = ({
  brand,
  jobType,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = spring({ frame, fps, config: { damping: 20 } });
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at top,#1a0e2a,#0a0710 70%)",
        color: "#f5edd5",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: 80,
      }}
    >
      <div
        style={{
          opacity: op,
          fontFamily: "Geist Mono, monospace",
          letterSpacing: 6,
          fontSize: 28,
          color: brand.colour,
        }}
      >
        {brand.name.toUpperCase()}
      </div>
      <div
        style={{
          opacity: op,
          fontFamily: "Cormorant Garamond, Georgia, serif",
          fontWeight: 700,
          fontSize: 92,
          lineHeight: 1.05,
          marginTop: 24,
          background:
            "linear-gradient(135deg,#fff3d6,#f5c557,#f97316)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {jobType}
      </div>
    </AbsoluteFill>
  );
};

const PhotoCard: React.FC<{ src: string; label: string }> = ({ src, label }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 60], [1.05, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#0a0710" }}>
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }} />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(10,7,16,0.9) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "Geist Mono, monospace",
          letterSpacing: 8,
          fontSize: 36,
          color: "#f5c557",
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};

const Coc: React.FC<{ coc: string; addr: string; tradie: string }> = ({ coc, addr, tradie }) => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse at center,#160c20,#0a0710 70%)",
      justifyContent: "center",
      alignItems: "center",
      color: "#f5edd5",
      fontFamily: "Geist Mono, monospace",
      textAlign: "center",
      padding: 80,
    }}
  >
    <div style={{ letterSpacing: 6, color: "#d4a520", fontSize: 22 }}>
      CERTIFICATE OF COMPLIANCE
    </div>
    <div style={{ fontSize: 88, marginTop: 24, color: "#fff3d6" }}>{coc}</div>
    <div style={{ marginTop: 32, fontSize: 24, color: "#cfc1a0" }}>{addr}</div>
    <div style={{ marginTop: 16, fontSize: 22, color: "#7e6f55" }}>signed · {tradie}</div>
  </AbsoluteFill>
);

export const TradieRecap: React.FC<TradieProps> = (props) => {
  // 30s @ 30fps = 900 frames. Title 90 + 3 photos × 210 + CoC 180.
  return (
    <>
      <Sequence from={0} durationInFrames={90}>
        <TitleCard brand={props.brand} jobType={props.jobType} />
      </Sequence>
      <Sequence from={90} durationInFrames={210}>
        <PhotoCard src={props.photos[0]} label="BEFORE" />
      </Sequence>
      <Sequence from={300} durationInFrames={210}>
        <PhotoCard src={props.photos[1]} label="DURING" />
      </Sequence>
      <Sequence from={510} durationInFrames={210}>
        <PhotoCard src={props.photos[2]} label="AFTER" />
      </Sequence>
      <Sequence from={720} durationInFrames={180}>
        <Coc coc={props.coCNumber} addr={props.jobAddress} tradie={props.tradieName} />
      </Sequence>
    </>
  );
};