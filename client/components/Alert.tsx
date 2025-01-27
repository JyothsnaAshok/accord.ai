import { Alert } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

interface AlertBoxProps {
  title: string;
  message: string;
  color: string;
}

export function AlertBox({ title, message, color }: AlertBoxProps) {
  const icon = <IconInfoCircle />;
  return (
    <Alert
      variant="light"
      color={color}
      withCloseButton
      title={title}
      icon={icon}
    >
      {message}
    </Alert>
  );
}
