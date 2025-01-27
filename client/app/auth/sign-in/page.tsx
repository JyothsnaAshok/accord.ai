import {
  Anchor,
  Button,
  Checkbox,
  Container,
  Group,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import classes from "./AuthenticationTitle.module.css";
import Link from "next/link";
import { signInAction } from "@/app/actions";

export default function AuthenticationTitle() {
  return (
    <Container size={420} my={40}>
      <Title ta="center" className={classes.title}>
        Welcome to accord.ai!
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Do not have an account yet?{" "}
        <Link href="/auth/sign-up" className="text-blue-500">
          <Anchor size="sm" component="button">
            Create account
          </Anchor>
        </Link>
      </Text>
      <form>
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <TextInput
            name="email"
            label="Email"
            placeholder="you@axample.com"
            required
          />
          <PasswordInput
            name="password"
            label="Password"
            placeholder="Your password"
            required
            mt="md"
          />
          <Group justify="space-between" mt="lg">
            <Checkbox label="Remember me" />
            <Anchor component="button" size="sm">
              Forgot password?
            </Anchor>
          </Group>
          <Button fullWidth mt="xl" formAction={signInAction} type="submit">
            Sign in
          </Button>
        </Paper>
      </form>
    </Container>
  );
}
