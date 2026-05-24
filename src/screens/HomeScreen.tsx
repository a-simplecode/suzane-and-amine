import Link from "next/link";
import { Button, Container, Heading, Section, Text } from "@/components/ui";
import { homeContent } from "@/data/home";

export function HomeScreen() {
  const { title, subtitle, cta } = homeContent;

  return (
    <Section spacing="lg">
      <Container size="md" className="flex flex-col items-center gap-6 text-center">
        <Heading level={1} align="center">
          {title}
        </Heading>
        <Text size="lg" tone="muted">
          {subtitle}
        </Text>
        <Link href={cta.href}>
          <Button size="lg">{cta.label}</Button>
        </Link>
      </Container>
    </Section>
  );
}
