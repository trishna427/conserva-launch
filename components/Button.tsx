type ButtonProps = {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary";
    type?: "button" | "submit";
  };
  
  export default function Button({
    children,
    onClick,
    variant = "primary",
    type = "button",
  }: ButtonProps) {
    const styles =
      variant === "primary"
        ? "w-full rounded-3xl bg-[#3F6B4F] py-5 text-lg font-bold text-white hover:opacity-90"
        : "w-full rounded-3xl border-2 border-[#E7E2D6] py-5 text-lg font-bold";
  
    return (
      <button type={type} onClick={onClick} className={styles}>
        {children}
      </button>
    );
  }