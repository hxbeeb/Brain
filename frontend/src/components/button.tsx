import type { ReactNode } from "react";

export interface ButtonProps {
  variant: "primary" | "secondary";
  size: "sm" | "md" | "lg";
  text: string;
  onClick: () => void;
  startIcon?: ReactNode;
  disabled?: boolean;
}

const variantClasses: Record<ButtonProps["variant"], string> = {
  primary: "bg-primary text-white hover:bg-primary/90",
  secondary: "bg-secondary text-white hover:bg-secondary/90",
};

const sizeClasses: Record<ButtonProps["size"], string> = {
  sm: "text-sm px-2 py-1.5",
  md: "text-base px-2 py-2",
  lg: "text-lg px-3 py-2",
};

export const Button = (props: ButtonProps) => {
  const classes = [
    variantClasses[props.variant],
    sizeClasses[props.size],
    "rounded flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
  ].join(" ");

  return (
    <button className={classes} onClick={props.onClick} disabled={props.disabled}>
      {props.startIcon}
      {props.text}
    </button>
  );
};