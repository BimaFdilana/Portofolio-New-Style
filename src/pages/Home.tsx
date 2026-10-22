import { Hero } from '../components/Hero'
import { AdventureLog, Dungeons, FinalQuest, Footer, Inventory, Relics } from '../components/Sections'

export function Home() {
  return (
    <>
      <Hero />
      <Inventory />
      <Dungeons />
      <Relics />
      <AdventureLog />
      <FinalQuest />
      <Footer />
    </>
  )
}
