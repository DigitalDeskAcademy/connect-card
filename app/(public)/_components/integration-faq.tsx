"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    id: "how-it-works",
    question:
      "How does Church Sync work with my existing church management software?",
    answer:
      "We push clean data to your system and add people to a list that triggers your existing welcome workflows.",
  },
  {
    id: "what-data",
    question: "What data can Church Sync access in my system?",
    answer:
      "Only people and lists—we can't see giving records, check-ins, or anything financial.",
  },
  {
    id: "security",
    question: "Is my data secure?",
    answer:
      "Yes—every church has completely isolated data, we encrypt everything, and you can disconnect us instantly at any time.",
  },
  {
    id: "time-savings",
    question: "How much time will this actually save?",
    answer:
      "On average, medium-sized churches save 10-15 hours a week of data entry.",
  },
];

export function IntegrationFAQ() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">FAQ</h2>

        <Accordion type="single" collapsible className="w-full">
          {faqItems.map(item => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="text-left">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
