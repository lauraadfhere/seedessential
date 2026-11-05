import { cn } from "./ui";
import { Link } from "./locale-link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Deep UI Components - Enhanced depth effects inspired by modern form designs
 * These components provide deeper shadows, better visual hierarchy, and more immersive depth
 */

// Enhanced depth shadow utilities
const depthShadows = {
  card: "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1),0_8px_16px_-4px_rgba(0,0,0,0.15)]",
  cardHover: "shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1),0_20px_25px_-5px_rgba(0,0,0,0.2)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.15),0_8px_10px_-6px_rgba(0,0,0,0.1)]",
  form: "shadow-[0_2px_8px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.12)]",
  input: "shadow-[0_1px_3px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(0,0,0,0.05)]",
  inputFocus: "shadow-[0_0_0_3px_rgba(64,83,61,0.15),0_4px_12px_rgba(64,83,61,0.2)]",
  button: "shadow-[0_2px_4px_rgba(0,0,0,0.1),0_4px_8px_rgba(0,0,0,0.15)]",
  buttonHover: "shadow-[0_4px_8px_rgba(0,0,0,0.15),0_8px_16px_rgba(0,0,0,0.2)]",
  floating: "shadow-[0_8px_16px_rgba(0,0,0,0.12),0_16px_32px_rgba(0,0,0,0.16)]",
};

/**
 * DeepCard - Enhanced card with deeper shadows and better depth
 */
export function DeepCard({
  children,
  className,
  hover = false,
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  variant?: "default" | "form" | "floating";
}) {
  const variants = {
    default: "bg-white border border-neutral-200/50 rounded-md",
    form: "bg-white border border-neutral-200 rounded-md",
    floating: "bg-white border border-neutral-100/50 rounded-lg",
  };

  const shadowVariants = {
    default: hover ? depthShadows.cardHover : depthShadows.card,
    form: depthShadows.form,
    floating: depthShadows.floating,
  };

  return (
    <div
      className={cn(
        variants[variant],
        shadowVariants[variant],
        "transition-all duration-300",
        hover && "hover:-translate-y-1",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * DeepFormContainer - Multi-step form container with side panel
 */
export function DeepFormContainer({
  children,
  title,
  description,
  step,
  totalSteps,
  sidePanel,
  className,
  variant = "default",
  dir = "ltr",
}: {
  children: ReactNode;
  title: string;
  description?: string;
  step?: number;
  totalSteps?: number;
  sidePanel?: ReactNode;
  className?: string;
  variant?: "default" | "dotted";
  dir?: "ltr" | "rtl";
}) {
  const backgrounds = {
    default: "bg-gradient-to-br from-[#f8f9f5] via-[#eef2ec] to-[#e8ebe4]",
    dotted: "bg-[#f5f5f5] [background-image:radial-gradient(#40533d_1px,transparent_1px)] [background-size:20px_20px]",
  };

  return (
    <div className={cn("min-h-screen", backgrounds[variant], className)} dir={dir}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className={cn("grid gap-8", dir === "rtl" ? "lg:grid-cols-[320px_1fr]" : "lg:grid-cols-[1fr_320px]")}>
          {/* Main Form Area */}
          <div className={cn("order-2 lg:order-1", dir === "rtl" ? "lg:order-2" : "lg:order-1")}>
            <DeepCard variant="form" className="p-6 sm:p-8 lg:p-10">
              {/* Step Indicator */}
              {step && totalSteps && (
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-2 w-8 rounded-full transition-all duration-300",
                          i < step ? "bg-[#40533d]" : i === step ? "bg-[#40533d]/60" : "bg-neutral-200"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-neutral-600">
                    Step {step} of {totalSteps}
                  </span>
                </div>
              )}

              {/* Title and Description */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#111] sm:text-3xl">{title}</h1>
                {description && (
                  <p className="mt-3 text-base leading-relaxed text-neutral-600">{description}</p>
                )}
              </div>

              {/* Form Content */}
              {children}
            </DeepCard>
          </div>

          {/* Side Panel */}
          {sidePanel && (
            <div className={cn("order-1 lg:order-2", dir === "rtl" ? "lg:order-1" : "lg:order-2")}>
              <DeepCard variant="default" className="p-6 sticky top-8">
                {sidePanel}
              </DeepCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * DeepInput - Enhanced input with better depth and focus states
 */
export function DeepInput({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  className,
  icon,
  ...props
}: {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  icon?: ReactNode;
} & Omit<ComponentProps<"input">, "value" | "onChange">) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-semibold text-neutral-800">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          required={required}
          disabled={disabled}
          className={cn(
            "w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition-all duration-200",
            Boolean(icon) && "pl-10",
            !disabled && "focus:border-[#40533d] focus:ring-2 focus:ring-[#40533d]/20",
            depthShadows.input,
            !disabled && "focus:shadow-[0_0_0_3px_rgba(64,83,61,0.15),0_4px_12px_rgba(64,83,61,0.2)]",
            disabled && "bg-neutral-50 cursor-not-allowed opacity-60",
            error && "border-red-300 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

/**
 * DeepSelect - Enhanced select with better depth
 */
export function DeepSelect({
  label,
  options,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  className,
  placeholder,
}: {
  label?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  placeholder?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-semibold text-neutral-800">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        required={required}
        disabled={disabled}
        className={cn(
          "w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition-all duration-200",
          !disabled && "focus:border-[#40533d] focus:ring-2 focus:ring-[#40533d]/20",
          depthShadows.input,
          !disabled && "focus:shadow-[0_0_0_3px_rgba(64,83,61,0.15),0_4px_12px_rgba(64,83,61,0.2)]",
          disabled && "bg-neutral-50 cursor-not-allowed opacity-60",
          error && "border-red-300 focus:border-red-500 focus:ring-red-500/20",
          className
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

/**
 * DeepTextarea - Enhanced textarea with better depth
 */
export function DeepTextarea({
  label,
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  rows = 4,
  className,
}: {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-semibold text-neutral-800">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        required={required}
        disabled={disabled}
        rows={rows}
        className={cn(
          "w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition-all duration-200 resize-none",
          !disabled && "focus:border-[#40533d] focus:ring-2 focus:ring-[#40533d]/20",
          depthShadows.input,
          !disabled && "focus:shadow-[0_0_0_3px_rgba(64,83,61,0.15),0_4px_12px_rgba(64,83,61,0.2)]",
          disabled && "bg-neutral-50 cursor-not-allowed opacity-60",
          error && "border-red-300 focus:border-red-500 focus:ring-red-500/20",
          className
        )}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

/**
 * DeepButton - Enhanced button with better depth and hover effects
 */
export function DeepButton({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className,
  onClick,
  href,
  type = "button",
  fullWidth = false,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
}) {
  const variants = {
    primary: "bg-[#40533d] text-white hover:bg-[#334532]",
    secondary: "bg-[#638260] text-white hover:bg-[#506b4e]",
    outline: "border-2 border-[#40533d] text-[#40533d] hover:bg-[#40533d] hover:text-white",
    ghost: "text-[#40533d] hover:bg-[#40533d]/10",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  const buttonClassName = cn(
    "rounded-md font-semibold transition-all duration-200",
    variants[variant], sizes[size], depthShadows.button,
    !disabled && !loading && "hover:shadow-[0_4px_8px_rgba(0,0,0,0.15),0_8px_16px_rgba(0,0,0,0.2)] hover:-translate-y-0.5",
    (disabled || loading) && "opacity-60 cursor-not-allowed", fullWidth && "w-full", className
  );
  const content = loading ? (
    <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />Loading...</span>
  ) : children;
  if (href && !disabled && !loading) return <Link href={href} onClick={onClick} className={buttonClassName}>{content}</Link>;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={buttonClassName}
    >
      {content}
    </button>
  );
}

/**
 * DeepOptionCard - Selectable option card with depth
 */
export function DeepOptionCard({
  children,
  selected = false,
  onClick,
  disabled = false,
  className,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full rounded-md border-2 bg-white p-4 text-left transition-all duration-200",
        selected
          ? "border-[#40533d] bg-[#40533d]/5 shadow-[0_0_0_3px_rgba(64,83,61,0.15),0_4px_12px_rgba(64,83,61,0.2)]"
          : "border-neutral-200 hover:border-[#40533d]/50 hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)]",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && !selected && "hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </button>
  );
}

/**
 * DeepInfoPanel - Side panel information display
 */
export function DeepInfoPanel({
  title,
  items,
  className,
}: {
  title: string;
  items: { label: string; value: ReactNode }[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">{title}</h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between border-b border-neutral-100 pb-2 last:border-0">
            <span className="text-sm text-neutral-600">{item.label}</span>
            <span className="text-sm font-semibold text-neutral-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * DeepFormSection - Form section with optional header
 */
export function DeepFormSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {title && (
        <div>
          <h2 className="text-lg font-semibold text-[#111]">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-neutral-600">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
