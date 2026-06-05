import { IntroLoader } from "@/components/IntroLoader";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Platforms } from "@/components/Platforms";
import { Achievements } from "@/components/Achievements";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <IntroLoader />
      <Header />
      <main>
        <Hero />
        <Features />
        <Platforms />
        <Achievements />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
