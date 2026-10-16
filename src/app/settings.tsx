import { ScrollView, Text, View } from 'react-native';
import {
  Check,
  Globe,
  Moon,
  Smartphone,
  Sun,
  type LucideIcon,
} from 'lucide-react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { PressableScale, Screen } from '@/components/common';
import { usePreferences } from '@/hooks/use-preferences';
import { useTheme } from '@/hooks/use-theme';
import {
  languageNames,
  languages,
  useI18n,
  type LanguagePreference,
} from '@/i18n';
import { selectionFeedback } from '@/lib/haptics';
import type { ThemePreference } from '@/styles/theme';

function Option({
  label,
  icon: Icon,
  selected,
  onPress,
}: {
  label: string;
  icon?: LucideIcon;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      scaleTo={0.98}
      onPress={() => {
        if (!selected) selectionFeedback();
        onPress();
      }}
      className={`min-h-14 flex-row items-center gap-3 rounded-xl border px-4 py-3 ${selected ? 'border-accent bg-brand-50' : 'border-line bg-surface'}`}
    >
      {Icon && (
        <Icon size={20} color={selected ? colors.accent : colors.muted} />
      )}
      <Text
        className={`flex-1 text-base ${selected ? 'font-semibold text-fg' : 'text-fg-soft'}`}
      >
        {label}
      </Text>
      {selected && (
        <Animated.View entering={ZoomIn.duration(200)}>
          <Check size={20} color={colors.accent} />
        </Animated.View>
      )}
    </PressableScale>
  );
}

export default function SettingsScreen() {
  const preferences = usePreferences();
  const { t } = useI18n();
  const themeOptions: {
    value: ThemePreference;
    label: string;
    icon: LucideIcon;
  }[] = [
    { value: 'system', label: t('settings.themeSystem'), icon: Smartphone },
    { value: 'light', label: t('settings.themeLight'), icon: Sun },
    { value: 'dark', label: t('settings.themeDark'), icon: Moon },
  ];
  const languageOptions: { value: LanguagePreference; label: string }[] = [
    { value: 'system', label: t('settings.languageSystem') },
    ...languages.map((value) => ({ value, label: languageNames[value] })),
  ];
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 28 }}>
        <View className="gap-3" accessibilityRole="radiogroup">
          <Text className="text-sm font-semibold uppercase tracking-wide text-muted">
            {t('settings.appearance')}
          </Text>
          {themeOptions.map((option) => (
            <Option
              key={option.value}
              label={option.label}
              icon={option.icon}
              selected={preferences.theme === option.value}
              onPress={() => preferences.setTheme(option.value)}
            />
          ))}
        </View>
        <View className="gap-3" accessibilityRole="radiogroup">
          <Text className="text-sm font-semibold uppercase tracking-wide text-muted">
            {t('settings.language')}
          </Text>
          {languageOptions.map((option) => (
            <Option
              key={option.value}
              label={option.label}
              icon={option.value === 'system' ? Globe : undefined}
              selected={preferences.language === option.value}
              onPress={() => preferences.setLanguage(option.value)}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
