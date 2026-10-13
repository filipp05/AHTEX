import Image from 'next/image'

// The original print artwork repeats one view vertically. This viewport shows
// the first view without inventing or retouching any part of the product.
export function AnchorArtwork({compact=false,priority=false}:{compact?:boolean;priority?:boolean}){
 return <figure className={`anchor-artwork${compact?' compact':''}`}>
  <div className="anchor-artwork-window"><Image src="/images/anchor-sheet.webp" alt="Трубчатый фрикционный анкер с опорной плитой" width={609} height={1200} priority={priority}/></div>
  <figcaption>Трубчатый анкер с опорной плитой · иллюстрация</figcaption>
 </figure>
}
