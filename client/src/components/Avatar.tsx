import { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { bigSmile , adventurerNeutral, funEmoji, notionistsNeutral, adventurer, bigEarsNeutral, thumbs, avataaarsNeutral, bottts} from "@dicebear/collection";
import clsx from "clsx";

const AvatarComponent = ({ seed, size = 32, hideOnMobile = false, noFlip = false }: { seed: string; size?: number, hideOnMobile?: boolean, noFlip?: boolean }) => {
  // Generate avatar using DiceBear
  const avatar = useMemo(() => {
    return createAvatar(bottts, {
      seed,
      size,
    //   backgroundColor: ["#C6F300", "#D6F5C9", "#B8EDA4"], 
      radius: 50, 
      baseColor: ["C6F300"],
    //   flip: !noFlip
    });
  }, [seed, size]);

  return (
    <div
      className={clsx(
        "relative flex items-center justify-center animate-slideIn",
        "rounded-4xl",
        hideOnMobile && "hidden sm:block",
      )}
    >
      <img src={avatar.toDataUri()} alt="Generated Avatar"/>
    </div>
  );
};

export default AvatarComponent;
