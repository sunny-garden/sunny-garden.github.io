import styled from 'styled-components'

type CatFaceSize = 'sm' | 'md' | 'lg'

interface CatFaceProps {
  className?: string
  label?: string
  size?: CatFaceSize
}

const sizeMap: Record<CatFaceSize, number> = {
  sm: 26,
  md: 42,
  lg: 74,
}

const CatFace = ({ className, label, size = 'md' }: CatFaceProps) => {
  return (
    <Face
      className={className}
      $size={sizeMap[size]}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      <span className="eye eye-left" />
      <span className="eye eye-right" />
      <span className="nose" />
      <span className="whisker whisker-left whisker-top" />
      <span className="whisker whisker-left whisker-bottom" />
      <span className="whisker whisker-right whisker-top" />
      <span className="whisker whisker-right whisker-bottom" />
    </Face>
  )
}

const Face = styled.span<{ $size: number }>`
  position: relative;
  display: inline-block;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  flex: 0 0 auto;
  border: 1px solid rgba(79, 89, 101, 0.22);
  border-radius: 48% 48% 45% 45%;
  background:
    radial-gradient(circle at 36% 30%, rgba(255, 255, 255, 0.54), transparent 28%),
    linear-gradient(180deg, var(--cat-gray-light), var(--cat-gray-soft));
  box-shadow:
    inset 0 -3px 0 rgba(79, 89, 101, 0.1),
    0 8px 18px rgba(79, 89, 101, 0.16);

  &::before,
  &::after {
    position: absolute;
    top: -16%;
    width: 38%;
    height: 42%;
    content: '';
    border: 1px solid rgba(79, 89, 101, 0.22);
    background: linear-gradient(145deg, var(--cat-gray-light), var(--cat-gray-mid));
    clip-path: polygon(50% 0, 100% 100%, 0 100%);
  }

  &::before {
    left: 3%;
    transform: rotate(-18deg);
  }

  &::after {
    right: 3%;
    transform: rotate(18deg);
  }

  .eye {
    position: absolute;
    top: 39%;
    width: 9%;
    height: 13%;
    border-radius: 999px;
    background: var(--cat-gray-dark);
  }

  .eye-left {
    left: 31%;
  }

  .eye-right {
    right: 31%;
  }

  .nose {
    position: absolute;
    top: 54%;
    left: 50%;
    width: 11%;
    height: 8%;
    border-radius: 50% 50% 58% 58%;
    background: var(--cat-gray-dark);
    transform: translateX(-50%);
  }

  .whisker {
    position: absolute;
    top: 61%;
    width: 24%;
    height: 1px;
    border-radius: 999px;
    background: rgba(79, 89, 101, 0.72);
  }

  .whisker-left {
    left: 10%;
    transform-origin: right center;
  }

  .whisker-right {
    right: 10%;
    transform-origin: left center;
  }

  .whisker-top.whisker-left {
    transform: rotate(10deg);
  }

  .whisker-bottom.whisker-left {
    top: 68%;
    transform: rotate(-8deg);
  }

  .whisker-top.whisker-right {
    transform: rotate(-10deg);
  }

  .whisker-bottom.whisker-right {
    top: 68%;
    transform: rotate(8deg);
  }
`

export default CatFace