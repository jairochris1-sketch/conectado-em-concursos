import React from "react";
import { cn } from "@/lib/utils";

const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
));
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef(({ className, onError, src, ...props }, ref) => {
  const [imgError, setImgError] = React.useState(false);

  const handleError = (e) => {
    setImgError(true);
    if (onError) onError(e);
  };

  // Se a imagem quebrou, retorna null para forçar o fallback
  if (imgError || !src) {
    return null;
  }

  return (
    <img
      ref={ref}
      src={src}
      className={cn("aspect-square h-full w-full object-cover", className)}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
});
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted text-white font-medium",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };