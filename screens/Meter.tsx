import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "./Root";
import FocusAwareStatusBar from "../components/util/FocusAwareStatusBar";
import {
  AspectRatio,
  Box,
  Button,
  Center,
  Fab,
  FlatList,
  HStack,
  Heading,
  Icon,
  Pressable,
  Image,
  Spinner,
  Text,
  VStack,
  Badge,
  ScrollView,
} from "native-base";
import Animated, { FadeInLeft } from "react-native-reanimated";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { formatDistanceToNow, intlFormat } from "date-fns";
import { useIsFocused } from "@react-navigation/native";
import useQuery from "../hooks/useQuery";
import { dbQuery } from "../util/db";
import ParallaxScroll from "../components/ParallaxScroll";
import { useWindowDimensions } from "react-native";

export type MeterProps = NativeStackScreenProps<RootStackParamList, "Meter">;

const AnimatedBox = Animated.createAnimatedComponent(Box);
const AnimatedHStack = Animated.createAnimatedComponent(HStack);

export default function Meter({ route: { params }, navigation }: MeterProps) {
  const { id } = params;
  const { width } = useWindowDimensions();
  const { data: meterData } = useQuery(
    () =>
      dbQuery<{
        id: string;
        name: string;
        location: string;
        unit: string;
        imagePath: string;
        notes: string;
        type: string;
      }>("SELECT * FROM meters WHERE id = ?;", [id]),
    [id]
  );
  const { data: readings } = useQuery(
    () =>
      dbQuery<{
        id: string;
        meterId: string;
        value: number;
        createdAt: string;
        synchedAt?: string;
        imagePath: string;
        technicianName?: string;
      }>("SELECT * FROM readings WHERE meterId = ? ORDER BY createdAt DESC;", [
        id,
      ]),
    [id]
  );
  console.log(meterData);

  const isFocused = useIsFocused();

  if (meterData == null) {
    return (
      <Center flex={1}>
        <FocusAwareStatusBar style="dark" />
        <Spinner />
      </Center>
    );
  }

  if (meterData.rows.length === 0) {
    return (
      <Center flex={1}>
        <FocusAwareStatusBar style="dark" />
        <Text mb={3}>The meter with id {id} was not found</Text>
        <Button
          variant="ghost"
          leftIcon={<Icon as={FontAwesome} name="arrow-left" />}
          onPress={() => navigation.goBack()}
        >
          Go back
        </Button>
      </Center>
    );
  }

  const meter = meterData.rows[0];

  return (
    <ParallaxScroll
      headerHeight={width}
      header={
        <AspectRatio ratio={1}>
          {meter.imagePath ? (
            <Image
              source={{
                uri: meter.imagePath,
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
      }
    >
      <FocusAwareStatusBar style="dark" />

      <Box m={3}>
        <Label label="Meter ID:" iconName="tag" text={meter.name} />
        <Label label="Location:" iconName="map-pin" text={meter.location} />
        <Label label="Type:" iconName="info" text={meter.type.toUpperCase()} />
      </Box>

      <Heading m={3} fontSize={"md"}>
        Notes
      </Heading>
      <AnimatedBox
        entering={FadeInLeft}
        m={3}
        p={3}
        bg="yellow.200"
        borderRadius={"lg"}
      >
        <Text fontSize={"lg"} textAlign={"justify"} flex={1}>
          {meter.notes}
        </Text>
      </AnimatedBox>

      {isFocused && (
        <Fab
          placement="bottom-right"
          colorScheme="primary"
          size="lg"
          icon={<Icon name="plus" pl={0.5} as={FontAwesome} />}
          onPress={() => navigation.navigate("CreateReading", { meterId: id })}
        />
      )}
      <Heading m={3} fontSize={"md"}>
        Latest readings
      </Heading>
      {readings?.rows.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => navigation.navigate("Reading", { id: item.id })}
        >
          {({ isPressed }) => (
            <AnimatedBox
              entering={FadeInLeft.delay(300).randomDelay()}
              px={5}
              py={3}
              mx={3}
              mb={3}
              opacity={isPressed ? 0.5 : 1}
              bg={item.synchedAt ? "green.500" : "red.500"}
              rounded="lg"
            >
              <HStack alignItems={"center"}>
                <VStack flex={1}>
                  <Text color="white" fontWeight="bold">
                    {item.technicianName}
                  </Text>
                  <Text color="white">
                    {formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                    })}
                  </Text>
                </VStack>
                <Text color="white" fontWeight={"bold"}>
                  {item.value} {meter.unit}
                </Text>
              </HStack>
            </AnimatedBox>
          )}
        </Pressable>
      ))}
    </ParallaxScroll>
  );
}

type LabelProps = {
  iconName: string;
  label: string;
  text: string;
};

function Label({ iconName, label, text }: LabelProps) {
  return (
    <AnimatedHStack space={2} entering={FadeInLeft} alignItems={"center"}>
      <Icon as={FontAwesome} name={iconName} color="primary.400" key="1" />
      <Text key="2">{label}</Text>
      <Text
        fontWeight={"bold"}
        color="primary.400"
        fontSize={"lg"}
        key="3"
        flex={1}
      >
        {text}
      </Text>
    </AnimatedHStack>
  );
}
