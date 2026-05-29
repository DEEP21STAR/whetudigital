import { Composition } from "remotion";
import { TradieRecap } from "./Composition";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="TradieRecap"
    component={TradieRecap}
    durationInFrames={900}   // 30 seconds at 30 fps
    fps={30}
    width={1080}
    height={1920}            // vertical, social-first
    defaultProps={{
      tradieName: "Sandeep Sparky",
      jobAddress: "12 Aurora Way, Hamilton",
      jobType: "Switchboard upgrade",
      coCNumber: "CoC-2026-001",
      photos: [
        "https://placehold.co/1080x1440/0a0710/d4a520?text=Before",
        "https://placehold.co/1080x1440/0a0710/d4a520?text=During",
        "https://placehold.co/1080x1440/0a0710/d4a520?text=After",
      ],
      brand: { name: "Whetū Digital", colour: "#d4a520" },
    }}
  />
);