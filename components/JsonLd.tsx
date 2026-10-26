/** Injeta dados estruturados schema.org (JSON-LD) na página.
 *  `<` vira <: JSON.stringify não escapa "</script>", e um valor com
 *  isso fecharia a tag e viraria HTML. O JSON continua equivalente. */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
