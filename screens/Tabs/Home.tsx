import {
  AspectRatio,
  Box,
  Center,
  HStack,
  Heading,
  IconButton,
  Text,
  Pressable,
  VStack,
  Button,
  Badge,
  Stack,
} from "native-base";
import { TabParamList } from "./Tabs";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { formatDistanceToNow, subDays } from "date-fns";
import { FontAwesome } from "@expo/vector-icons";
import Animated, {
  FadeInLeft,
  FadeInUp,
  SlideInLeft,
} from "react-native-reanimated";
import { CompositeScreenProps } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Root";
import useQuery from "../../hooks/useQuery";
import { dbQuery } from "../../util/db";
import useAuth from "../../hooks/useAuth";
import Logo from "../../assets/logo-w.svg";
import ParallaxScroll from "../../components/ParallaxScroll";
import { useTranslation } from "react-i18next";
import dateFnsLocale from "../../util/dateFnsLocale";
import ChangeLanguageButtons from "../../components/ChangeLanguageButtons";
import { apiUrl } from "../../config";
import useStatusBar from "../../hooks/useStatusBar";
import { nativeApplicationVersion } from "expo-application";

export type HomeProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

const AnimatedBox = Animated.createAnimatedComponent(Box);

const getMeters = (userId: string) =>
  dbQuery<{
    id: string;
    meterName: string;
    meterId: string;
    value: number;
    createdAt: string;
    unit: string;
    location: string;
    technicianName: string;
  }>(
    `SELECT readings.*, meters.name as meterName, meters.unit, meters.location 
     FROM readings JOIN meters ON readings.meterId = meters.id 
     WHERE readings.technicianId = ? AND readings.createdAt > ? 
     ORDER BY createdAt 
     DESC LIMIT 12;`,
    [userId, subDays(new Date(), 7).toISOString()]
  );

export default function Home({ navigation }: HomeProps) {
  useStatusBar({ style: "light" });
  const auth = useAuth();
  const { data: readings } = useQuery(
    () => auth.userData && getMeters(auth.userData.id),
    [auth.userData]
  );
  const { data: readingCount } = useQuery(
    () =>
      dbQuery<{ count: 5 }>(
        "SELECT COUNT(*) as count FROM readings WHERE date(createdAt) = date('now');"
      ),
    []
  );
  const { t, i18n } = useTranslation();

  return (
    <Box flex={1}>
      <ParallaxScroll
        header={
          <AnimatedBox
            safeAreaTop
            bg={{
              linearGradient: {
                colors: ["primary.400", "secondary.400"],
                start: [0, 0],
                end: [0, 1],
              },
            }}
            p={3}
            pb={7}
            entering={FadeInUp}
          >
            <ChangeLanguageButtons />
            <Box safeAreaTop p={3} position={"absolute"}></Box>
            <Center p={3} flex={1}>
              <AspectRatio ratio={1} w="40%">
                <Logo width={"100%"} height={"100%"} />
              </AspectRatio>
              {process.env.EXPO_PUBLIC_STAGING ? (
                <Badge colorScheme={"yellow"}>STAGING</Badge>
              ) : null}
            </Center>
            <HStack
              alignItems={"center"}
              justifyContent={"space-between"}
              mb={2}
            >
              <AnimatedBox entering={FadeInLeft.delay(100)}>
                <Text color="light.100">{t("welcome", "Welcome")},</Text>
                <Heading fontStyle="italic" color="white">
                  {auth.userData?.name}
                </Heading>
              </AnimatedBox>
              <AnimatedBox entering={FadeInLeft.delay(200)}>
                <IconButton
                  colorScheme={"light"}
                  _icon={{ as: FontAwesome, name: "sign-out", color: "white" }}
                  onPress={() => auth.signOut()}
                />
              </AnimatedBox>
            </HStack>
            {nativeApplicationVersion ? (
              <Text color="light.100" fontSize="xs">
                version {nativeApplicationVersion}
              </Text>
            ) : null}
          </AnimatedBox>
        }
        flex={1}
      >
        <Box bg="light.100" roundedTop={"lg"}>
          <AnimatedBox
            bg="white"
            w="80%"
            mx="auto"
            p={5}
            mt={-4}
            mb={3}
            rounded="md"
            textAlign={"center"}
            entering={FadeInUp.delay(150)}
          >
            <Text color="secondary.400">
              {t("home.readingsToday", "Readings today")}
            </Text>
            <Heading color="emphasis.500">
              {readingCount?.rows[0].count || 0}
            </Heading>
          </AnimatedBox>

          <Box p={3}>
            <Heading size="sm" mb={3}>
              {t("home.latestReadings", "Latest Readings")}
            </Heading>
            {readings?.rows.map((reading) => (
              <AnimatedBox
                key={reading.id}
                entering={SlideInLeft.delay(100).randomDelay()}
              >
                <Pressable
                  onPress={() =>
                    navigation.navigate("Reading", { id: reading.id })
                  }
                >
                  {({ isPressed }) => (
                    <HStack
                      alignItems="center"
                      space={5}
                      opacity={isPressed ? 0.5 : 1}
                      p={5}
                      mb={3}
                      bg="white"
                      rounded="lg"
                    >
                      <VStack flex={1}>
                        <Text color="emphasis.500">
                          {reading.technicianName}
                        </Text>
                        <Text>{reading.meterName}</Text>
                        <Text color="light.500">
                          {formatDistanceToNow(new Date(reading.createdAt), {
                            addSuffix: true,
                            locale: dateFnsLocale(i18n.resolvedLanguage),
                          })}
                        </Text>
                      </VStack>
                      <Text color="red.500" fontWeight={"bold"}>
                        {reading.value} {reading.unit}
                      </Text>
                    </HStack>
                  )}
                </Pressable>
              </AnimatedBox>
            ))}
          </Box>
        </Box>
      </ParallaxScroll>
    </Box>
  );
}
