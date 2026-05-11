import * as React from 'react';
import { View, type ViewProps } from 'react-native';

import { AppText, type AppTextProps } from './app-text';
import { Surface } from './surface';

function Card({ style, ...props }: ViewProps) {
  return <Surface elevated style={[{ gap: 24, padding: 24 }, style]} {...props} />;
}

function CardHeader({ style, ...props }: ViewProps) {
  return <View style={[{ gap: 6 }, style]} {...props} />;
}

function CardTitle(props: AppTextProps) {
  return <AppText color="cardForeground" variant="title" weight="semibold" {...props} />;
}

function CardDescription(props: AppTextProps) {
  return <AppText color="mutedForeground" variant="body" {...props} />;
}

function CardContent({ style, ...props }: ViewProps) {
  return <View style={[{ gap: 8 }, style]} {...props} />;
}

function CardFooter({ style, ...props }: ViewProps) {
  return (
    <View style={[{ alignItems: 'center', flexDirection: 'row', gap: 8 }, style]} {...props} />
  );
}

function CardAction({ style, ...props }: ViewProps) {
  return (
    <View
      style={[{ alignItems: 'center', alignSelf: 'flex-end', flexDirection: 'row', gap: 8 }, style]}
      {...props}
    />
  );
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
