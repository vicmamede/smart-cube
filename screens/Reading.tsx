import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "./Root";
import {
  AspectRatio,
  Box,
  Button,
  Center,
  HStack,
  Icon,
  Image,
  Spinner,
  Text,
} from "native-base";
import Animated, { FadeInLeft } from "react-native-reanimated";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { formatDistanceToNow, intlFormat } from "date-fns";
import useQuery from "../hooks/useQuery";
import { dbQuery } from "../util/db";
import { useTranslation } from "react-i18next";
import dateFnsLocale from "../util/dateFnsLocale";
import useStatusBar from "../hooks/useStatusBar";

export type ReadingProps = NativeStackScreenProps<
  RootStackParamList,
  "Reading"
>;

const AnimatedHStack = Animated.createAnimatedComponent(HStack);

export default function Reading({
  route: { params },
  navigation,
}: ReadingProps) {
  const { id } = params;
  useStatusBar({ style: "dark" });
  const { data: meterData } = useQuery(
    () =>
      dbQuery<{
        id: string;
        meterName: string;
        meterId: string;
        value: number;
        createdAt: string;
        synchedAt?: string;
        imagePath?: string;
        unit: string;
        technicianName?: string;
      }>(
        "SELECT readings.*, meters.name as meterName, meters.unit FROM readings JOIN meters ON readings.meterId = meters.id WHERE readings.id = ?;",
        [id]
      ),
    [id]
  );
  const { t, i18n } = useTranslation();

  if (meterData == null) {
    return (
      <Center flex={1}>
        <Spinner />
      </Center>
    );
  }

  if (meterData.rows.length === 0) {
    return (
      <Center flex={1}>
        <Text mb={3}>
          {t("reading.notFound", "The reading with id {{id}} was not found", {
            id,
          })}
        </Text>
        <Button
          variant="ghost"
          leftIcon={<Icon as={FontAwesome} name="arrow-left" />}
          onPress={() => navigation.goBack()}
        >
          {t("back", "Go back")}
        </Button>
      </Center>
    );
  }

  const reading = meterData.rows[0];

  const imagePath = reading.imagePath;

  return (
    <>
      <Box flex={1}>
        <AspectRatio ratio={1}>
          {imagePath ? (
            <Image
              source={{
                uri: imagePath,
              }}
              resizeMode="cover"
              w={"100%"}
              h={"100%"}
              alt="meter picture"
            />
          ) : (
            <Center flex={1} bg="black">
              <Icon
                as={FontAwesome5}
                name="image"
                size={24}
                color="light.800"
              />
            </Center>
          )}
        </AspectRatio>
        <Box p={3} flex={1}>
          <AnimatedHStack
            entering={FadeInLeft.delay(200).randomDelay()}
            space={1}
            alignItems={"center"}
          >
            <Icon as={FontAwesome} name="tag" color="primary.400" key="1" />
            <Text key="2">{t("reading.meterId", "Meter Id:")} </Text>
            <Text
              fontWeight={"bold"}
              color="primary.400"
              fontSize={"lg"}
              key="3"
            >
              {reading.meterName}
            </Text>
          </AnimatedHStack>
          <AnimatedHStack
            entering={FadeInLeft.delay(200).randomDelay()}
            space={1}
            alignItems={"center"}
          >
            <Icon as={FontAwesome} name="gear" color="primary.400" key="1" />
            <Text key="2">{t("reading.doneBy", "Done By:")} </Text>
            <Text
              fontWeight={"bold"}
              color="primary.400"
              fontSize={"lg"}
              key="3"
            >
              {reading.technicianName}
            </Text>
          </AnimatedHStack>
          <AnimatedHStack
            entering={FadeInLeft.delay(200).randomDelay()}
            space={1}
            alignItems={"center"}
          >
            <Icon as={FontAwesome} name="info" color="primary.400" key="1" />
            <Text key="2">{t("reading.status", "Status:")} </Text>
            {reading.synchedAt ? (
              <Text
                fontWeight={"bold"}
                color="green.400"
                fontSize={"lg"}
                key="3"
              >
                {t("reading.synchronized", "Synchronized:")}{" "}
                {formatDistanceToNow(new Date(reading.synchedAt), {
                  addSuffix: true,
                  locale: dateFnsLocale(i18n.resolvedLanguage),
                })}
              </Text>
            ) : (
              <Text
                fontWeight={"bold"}
                color="primary.400"
                fontSize={"lg"}
                key="3"
              >
                {t("reading.notSynchronized", "Not synchronized")}
              </Text>
            )}
            {/* For some reason RN is complaining about the missing key parameter here, don't know why */}
          </AnimatedHStack>
          <Center p={3} mb={3} flex={1}>
            <Text fontSize={"4xl"} key="3">
              {reading.value} {reading.unit}
            </Text>
          </Center>
          <Button
            onPress={() =>
              navigation.navigate("Meter", { id: reading.meterId })
            }
            rightIcon={<Icon as={FontAwesome} name="arrow-right" />}
          >
            {t("reading.goToMeter", "Go to Meter")}
          </Button>
        </Box>
      </Box>
    </>
  );
}
