export const COUNTRIES = ["United States", "Canada", "United Kingdom", "Australia", "France", "Germany", "India", "Ireland", "Japan", "Netherlands", "New Zealand", "Singapore", "Spain", "Other"];
export function CountryPicker({ initial = "United States" }: { initial?: string }) {
  return <label className="trial-country">Country/region <select name="country" defaultValue={COUNTRIES.includes(initial) ? initial : "United States"}>{COUNTRIES.map(country => <option key={country}>{country}</option>)}</select></label>;
}
