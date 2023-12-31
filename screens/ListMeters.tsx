import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "./Root";
import {
  Box,
  Center,
  FlatList,
  HStack,
  Heading,
  Pressable,
  Spinner,
  Text,
  VStack,
} from "native-base";
import { formatDistanceToNow, isToday } from "date-fns";
import useQuery from "../hooks/useQuery";
import { dbQuery } from "../util/db";
import Animated, { FadeInLeft } from "react-native-reanimated";
import useInfiniteQuery from "../hooks/useInfiniteQuery";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import dateFnsLocale from "../util/dateFnsLocale";
import useStatusBar from "../hooks/useStatusBar";

export type ListMetersProps = NativeStackScreenProps<
  RootStackParamList,
  "ListMeters"
>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const perPage = 8;

type DataType = {
  id: string;
  name: string;
  createdAt?: string;
};

export default function ListMeters({
  route: { params },
  navigation,
}: ListMetersProps) {
  const { location } = params;
  const { t } = useTranslation();
  useStatusBar({ style: "dark" });

  const { data, fetchNextPage, isFinished, isRefreshing, refresh } =
    useInfiniteQuery(
      (pageParam: string) =>
        dbQuery<DataType>(
          `SELECT meters.*, MAX(readings.createdAt) as createdAt 
        FROM meters LEFT JOIN readings ON readings.meterId = meters.id 
        WHERE meters.location = ? 
        GROUP BY meters.id 
        HAVING meters.id > ?
        ORDER BY meters.id LIMIT ?
        `,
          [location, pageParam, perPage]
        ),

      (lastPage) => {
        if (lastPage == null) {
          return "";
        }

        if (lastPage.rows.length < perPage) {
          return null;
        }

        return lastPage.rows[lastPage.rows.length - 1].id;
      },
      [location]
    );
  const { data: readingsToday } = useQuery(
    () =>
      dbQuery<{
        count: number;
      }>(
        `SELECT COUNT(readings.id) as count 
         FROM readings JOIN meters ON readings.meterId = meters.id 
         WHERE meters.location = ? AND date(createdAt) == date('now')`,
        [location]
      ),
    [location]
  );
  const { data: readingsTotal } = useQuery(
    () =>
      dbQuery<{
        count: number;
      }>(
        `SELECT COUNT(id) as count 
         FROM meters 
         WHERE location = ?`,
        [location]
      ),
    [location]
  );

  const flatData = data.reduce<DataType[]>(
    (prev, curr) => [...prev, ...curr.rows],
    []
  );

  return (
    <Box flex={1} bg="light.100">
      <FlatList
        ListHeaderComponent={
          <>
            <Center
              key="heading"
              bg={{
                linearGradient: {
                  colors: ["primary.400", "secondary.400"],
                  start: [0, 0],
                  end: [0, 1],
                },
              }}
              p={8}
              pb={10}
            >
              <Box w="full">
                <Heading color="white">
                  <Text key="title" fontWeight={"normal"} fontStyle={"italic"}>
                    {t("listMeters.location", "Location").toUpperCase()}:
                  </Text>{" "}
                  {location}
                </Heading>
                <Text color="white">
                  {t(
                    "listMeters.readingsToday",
                    "Readings today: {{num}}/{{den}}",
                    {
                      num: readingsToday?.rows[0].count ?? "-",
                      den: readingsTotal?.rows[0]?.count ?? "-",
                    }
                  )}
                </Text>
              </Box>
            </Center>
            <Heading
              key="title"
              mt={-3}
              bg="light.100"
              mb={3}
              fontSize={"md"}
              p={3}
              borderTopRadius={"lg"}
            >
              {t("listMeters.meters", "Meters")}
            </Heading>
          </>
        }
        flex={1}
        data={flatData}
        onEndReached={() => !isFinished && fetchNextPage()}
        refreshing={isRefreshing}
        onRefresh={refresh}
        ListFooterComponent={
          !isFinished ? (
            <Center p={5}>
              <Spinner />
            </Center>
          ) : null
        }
        renderItem={({ item }) => (
          <ListItem
            {...item}
            onPress={() => navigation.navigate("Meter", { id: item.id })}
          />
        )}
      />
    </Box>
  );
}

const ListItem = memo(
  ({
    createdAt,
    name,
    onPress,
  }: {
    createdAt?: string;
    name: string;
    onPress: () => void;
  }) => {
    const { t, i18n } = useTranslation();
    return (
      <AnimatedPressable
        entering={FadeInLeft.delay(150).randomDelay()}
        onPress={onPress}
        mx={3}
        mb={3}
      >
        <HStack
          bg={
            createdAt && isToday(new Date(createdAt))
              ? "success.500"
              : "warning.500"
          }
          rounded={"lg"}
          p={3}
        >
          <VStack>
            <Text fontWeight={"bold"} fontSize="lg" color="white">
              {name}
            </Text>
            <Text color="white">
              {t("listMeters.lastReading", "Last reading {{date}}", {
                date: createdAt
                  ? formatDistanceToNow(new Date(createdAt), {
                      addSuffix: true,
                      locale: dateFnsLocale(i18n.resolvedLanguage),
                    })
                  : "never",
              })}
            </Text>
          </VStack>
        </HStack>
      </AnimatedPressable>
    );
  }
);
