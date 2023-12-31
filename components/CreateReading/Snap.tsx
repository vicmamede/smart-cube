import { Camera as BaseCamera, CameraCapturedPicture } from "expo-camera";
import { useRef, useState } from "react";
import { Box, Button, Center, HStack, Icon, Spinner, Text } from "native-base";
import Camera from "../Camera";
import { FontAwesome5 } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export type SnapProps = {
  onSnapshot?: (picture: CameraCapturedPicture) => void;
  onSkip?: () => void;
};

export default function Snap({ onSnapshot, onSkip }: SnapProps) {
  const [isReady, setIsReady] = useState(false);
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const { t } = useTranslation();

  const cameraRef = useRef<BaseCamera>(null);

  return (
    <Box flex={1}>
      <Camera ref={cameraRef} onCameraReady={() => setIsReady(true)} />
      <Center p={5}>
        <Text textAlign="center" color="dark.400" mb={3}>
          {t(
            "createReading.pointCamera",
            "Point your camera to the meter and press the button to take a snapshot"
          )}
        </Text>
        <HStack space={3} alignItems={"center"}>
          <Button colorScheme={"muted"} size="sm" onPress={() => onSkip?.()}>
            {t("skip", "Skip")}
          </Button>
          <Button
            size="lg"
            isLoading={!isReady || isTakingPicture}
            leftIcon={<Icon as={FontAwesome5} name="camera" />}
            onPress={async () => {
              if (cameraRef.current == null) return;

              setIsTakingPicture(true);
              const picture = await cameraRef.current.takePictureAsync();
              setIsTakingPicture(false);
              onSnapshot?.(picture);
            }}
          >
            {t("createReading.takeSnap", "Take snap")}
          </Button>
        </HStack>
      </Center>
    </Box>
  );
}
