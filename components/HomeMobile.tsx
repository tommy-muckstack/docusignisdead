import { MeasuredPage } from "@/components/m/MeasuredPage";
import pm from "@/components/m/home390.json";

// Phone layout (<=900px) measured from docusign.com at 390px; the desktop markup is hidden at that width.
export function HomeMobile() { return <MeasuredPage data={pm as never} className="ds-hm" />; }
