import {ComponentPreview, Previews} from "@react-buddy/ide-toolbox";
import {PaletteTree} from "./palette";
import FeedbackModal from "../components/Navbar/modals/feedback.tsx";

const ComponentPreviews = () => {
    return (
        <Previews palette={<PaletteTree/>}>
            <ComponentPreview path="/FeedbackModal">
                <FeedbackModal type={"error"} open={false} onClose={function(): void {
                    throw new Error("Function not implemented.");
                } }/>
            </ComponentPreview>
        </Previews>
    );
};

export default ComponentPreviews;