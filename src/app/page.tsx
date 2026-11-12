import { About } from "@/components/About";
import { Audiences } from "@/components/Audiences";
import { ConnectionMap } from "@/components/ConnectionMap";
import { Ecosystem } from "@/components/Ecosystem";
import { FinalCta } from "@/components/FinalCta";
import { Hero } from "@/components/Hero";
import { Philosophy } from "@/components/Philosophy";
import { Products } from "@/components/Products";
import { Technology } from "@/components/Technology";
import { Vision } from "@/components/Vision";

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Ecosystem />
      <Products />
      <ConnectionMap />
      <Technology />
      <Audiences />
      <Philosophy />
      <Vision />
      <FinalCta />
    </>
  );
}
