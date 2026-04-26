import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ExpandableTextProps {
  text: string;
  className?: string;
  maxLines?: number;
}

export function ExpandableText({ text, className, maxLines = 2 }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const element = textRef.current;
    if (element) {
      // Verifica se o conteúdo ultrapassa a altura máxima permitida para o número de linhas
      const lineHeight = parseInt(window.getComputedStyle(element).lineHeight);
      const maxHeight = lineHeight * maxLines;
      setShouldShowButton(element.scrollHeight > maxHeight);
    }
  }, [text, maxLines]);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="space-y-1">
      <p
        ref={textRef}
        className={cn(
          "transition-all duration-200",
          !isExpanded && "line-clamp-2",
          className
        )}
      >
        {text}
      </p>
      {shouldShowButton && (
        <button
          onClick={toggleExpand}
          className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-tight"
        >
          {isExpanded ? "Ver menos" : "Ver mais"}
        </button>
      )}
    </div>
  );
}