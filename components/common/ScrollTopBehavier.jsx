import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function ScrollTopBehaviour() {
  const pathname = usePathname();
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    window.scrollTo({
      top: 0,
      behavior: "instant", // You can use 'auto' or 'instant' as well
    });
  }, [pathname]);

  return <></>;
}
