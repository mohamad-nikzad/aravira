import * as React from 'react';
import { Text, type TextProps } from 'react-native';

import { tw } from '../../lib/utils';
function Label({ className, ...props }: TextProps & { className?: string }) {
  return <Text style={tw('text-sm font-medium text-foreground', className)} {...props} />;
}

export { Label };
