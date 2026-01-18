"use client";
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    (<Sonner
      theme={theme}
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gray-900 group-[.toaster]:text-white group-[.toaster]:border group-[.toaster]:border-gray-700 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-lg group-[.toaster]:backdrop-blur-md group-[.toaster]:p-4",
          description: "group-[.toast]:text-gray-300 group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-cyan-500 group-[.toast]:hover:bg-cyan-600 group-[.toast]:text-white group-[.toast]:rounded-full group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:font-semibold group-[.toast]:transition-all",
          cancelButton:
            "group-[.toast]:bg-gray-700 group-[.toast]:hover:bg-gray-600 group-[.toast]:text-white",
        },
      }}
      {...props} />)
  );
}

export { Toaster }